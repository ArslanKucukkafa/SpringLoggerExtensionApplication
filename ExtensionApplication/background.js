const SERVER_URL = "http://localhost:8080"; // Sabit URL tanımı
let eventSource = null;
let isConnected = false;

// Bildirim izinlerini kontrol et ve iste
async function checkNotificationPermission() {
  if (Notification.permission === "granted") {
    console.log("Bildirim izni zaten verilmiş");
    return true;
  } else if (Notification.permission !== "denied") {
    console.log("Bildirim izni isteniyor");
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

function formatLogMessage(log) {
  let formattedMessage = log.message;
  if (log.logger === "RequestLoggingFilter") {
    const lines = log.message.split("\n");
    formattedMessage = `${lines[0]}`; // Sadece URI satırını göster
  }
  return (
    formattedMessage.substring(0, 100) +
    (formattedMessage.length > 100 ? "..." : "")
  );
}

// Popup'a mesaj gönderme yardımcı fonksiyonu
async function sendMessageToPopup(message) {
  try {
    // Popup'ın açık olup olmadığını kontrol et
    const windows = await chrome.windows.getAll();
    const currentWindow = windows.find((w) => w.type === "popup");

    if (!currentWindow) {
      // Popup kapalıysa sessizce çık
      return;
    }

    // Popup açıksa mesajı gönder
    chrome.runtime.sendMessage(message).catch(() => {
      // Hata olursa sessizce devam et
    });
  } catch (error) {
    // Sessizce devam et
  }
}

// Test bildirimi gönderen fonksiyon
async function testNotification() {
  // Bildirim iznini kontrol et
  const permissionGranted = await checkNotificationPermission();
  if (!permissionGranted) {
    console.error("Bildirim izni yok!");
    return;
  }

  // Basit bir Chrome bildirimi
  chrome.notifications.create(
    "test-notification", // Bildirim kimliği
    {
      type: "basic",
      iconUrl: "images/icon.png", // Resim dosyasının doğru yolunu kontrol edin
      title: "Bildirim Başlığı",
      message: "Bildirim Mesajı",
    },
    function (notificationId) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Bildirim oluşturuldu: " + notificationId);
      }
    },
  );
}

// Extension yüklendiğinde test bildirimi gönder
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension yüklendi");
  testNotification();
});

// Her log için bildirim gönder
async function showLogNotification(log) {
  const permissionGranted = await checkNotificationPermission();
  if (!permissionGranted) {
    console.error("Bildirim izni yok!");
    return;
  }

  // Log seviyesine göre ikon ve başlık belirleme
  let iconUrl = "images/icon.png"; // Varsayılan ikon
  let titlePrefix = "";

  if (log.level === "INFO") {
    iconUrl = "images/confirm.png"; // INFO için yeşil ikon
    titlePrefix = "[INFO] ";
  } else if (log.level === "ERROR") {
    iconUrl = "images/error.png"; // ERROR için kırmızı ikon
    titlePrefix = "[ERROR] ";
  }

  const notificationBody = `
    Timestamp: ${log.timestamp}
    Level: ${log.level}
    Logger: ${log.logger}
    Message: ${log.message}
    Request ID: ${log.requestId}
  `;

  const options = {
    type: "basic",
    iconUrl: iconUrl, // Log seviyesine göre ikon
    title: titlePrefix + "Yeni Log Mesajı",
    message: notificationBody,
    requireInteraction: true, // Bildirimin kullanıcı etkileşimi gerektirmesi
  };

  chrome.notifications.create("", options, function (notificationId) {
    if (chrome.runtime.lastError) {
      console.error("Bildirim oluşturulamadı:", chrome.runtime.lastError);
    } else {
      console.log("Bildirim oluşturuldu:", notificationId);
      // Bildirimi belirli bir süre sonra temizleme
      setTimeout(function () {
        chrome.notifications.clear(notificationId, function (wasCleared) {
          if (chrome.runtime.lastError) {
            console.error("Bildirim temizlenemedi:", chrome.runtime.lastError);
          } else {
            console.log("Bildirim temizlendi:", wasCleared);
          }
        });
      }, 5000); // 5 saniye sonra bildirimi temizle
    }
  });
}

// EventSource mesaj alındığında bildirim oluşturma
function startLogListener() {
  eventSource = new EventSource(`${SERVER_URL}/api/logs`);

  eventSource.onmessage = async (event) => {
    const log = JSON.parse(event.data);
    console.log("Log alındı:", log);
    await showLogNotification(log);
  };

  eventSource.onerror = () => {
    console.error("EventSource bağlantı hatası");
    isConnected = false;
    broadcastConnectionStatus("error", "Bağlantı yok");
  };

  eventSource.onopen = () => {
    console.log("EventSource bağlantı başarılı");
    isConnected = true;
    broadcastConnectionStatus("connected", "Bağlantı kuruldu");
  };
}

// Log dinleyiciyi başlat
startLogListener();

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getConnectionStatus") {
    sendResponse({
      isConnected: isConnected,
      status: isConnected ? "connected" : "error",
      message: isConnected ? "Bağlantı kuruldu" : "Bağlantı yok",
    });
  }
  return true;
});

// Bağlantı durumunu yayınla
async function broadcastConnectionStatus(status, message) {
  try {
    await chrome.runtime.sendMessage({
      action: "connectionStatus",
      status: status,
      message: message,
      serverUrl: SERVER_URL,
    });
  } catch (error) {
    console.debug("Popup kapalı olabilir:", error);
  }
}

// Düzenli olarak bağlantı durumunu kontrol et
setInterval(() => {
  if (eventSource) {
    console.log("EventSource durumu:", {
      readyState: eventSource.readyState,
      isConnected: isConnected,
      url: eventSource.url,
    });
  }
}, 5000);

// Bildirime tıklanınca
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log("Bildirime tıklandı:", notificationId);
  chrome.notifications.clear(notificationId);
});
