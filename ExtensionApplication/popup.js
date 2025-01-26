let connectButton;
let urlInput;
let statusElement;
let logContainer;

document.addEventListener("DOMContentLoaded", () => {
  // UI elementlerini seç
  const logsList = document.getElementById("logsList");
  const refreshBtn = document.getElementById("refreshBtn");
  const autoRefreshToggle = document.getElementById("autoRefresh");
  const clearLogsBtn = document.getElementById("clearLogs");
  const toggleNotificationsBtn = document.getElementById("toggleNotifications");
  const serverUrlInput = document.getElementById("serverUrl");
  const connectBtn = document.getElementById("connect");

  // Ayarları yükle
  loadSettings();

  // Logları temizle
  clearLogsBtn.addEventListener("click", () => {
    logsList.innerHTML = "";
  });

  // Log mesajını ekle
  function addLogMessage(message) {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";

    const timestamp = new Date().toLocaleString();

    logEntry.innerHTML = `
            <div class="log-time">${timestamp}</div>
            <div class="log-message">${message}</div>
        `;

    logsList.insertBefore(logEntry, logsList.firstChild);
  }

  let eventSource = null;
  let notificationsEnabled = true;

  // Chrome storage'dan URL'yi al
  chrome.storage.local.get(
    ["serverUrl", "notificationsEnabled"],
    function (result) {
      if (result.serverUrl) {
        serverUrlInput.value = result.serverUrl;
        connectToServer(result.serverUrl);
      }
      notificationsEnabled = result.notificationsEnabled !== false;
      document.getElementById("toggleNotifications").checked =
        notificationsEnabled;
    },
  );

  // Connect butonuna tıklandığında
  connectBtn.addEventListener("click", function () {
    const url = serverUrlInput.value.trim();
    if (!url) {
      updateStatus("URL boş olamaz!", "error");
      return;
    }

    // URL'i kaydet
    chrome.storage.local.set({ serverUrl: url }, function () {
      console.log("URL kaydedildi:", url);

      // Bağlantıyı başlat
      chrome.runtime.sendMessage({
        action: "startConnection",
        url: url,
      });

      updateStatus("Bağlanıyor...", "connecting");
    });
  });

  // Logları temizle
  document.getElementById("clearLogs").addEventListener("click", function () {
    document.getElementById("logs").innerHTML = "";
  });

  // Bildirimleri aç/kapa
  document
    .getElementById("toggleNotifications")
    .addEventListener("change", function (e) {
      notificationsEnabled = e.target.checked;
      chrome.storage.local.set({ notificationsEnabled: notificationsEnabled });
    });

  function updateConnectionStatus(isConnected, message) {
    const statusDot = document.querySelector(".status-dot");
    const statusText = document.querySelector(".status-text");
    const connectButton = document.getElementById("connectButton");

    statusDot.className = "status-dot " + (isConnected ? "connected" : "error");

    statusText.textContent =
      message || (isConnected ? "Bağlı" : "Bağlantı kesildi");
    connectButton.textContent = isConnected ? "Bağlantıyı Kes" : "Bağlan";
    connectButton.disabled = false;
  }

  function connectToServer(url) {
    updateConnectionStatus(false, null);

    // Background script'e bağlantı isteği gönder
    chrome.runtime.sendMessage({
      action: "connect",
      url: url,
    });
  }

  // Background'dan gelen mesajları dinle
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Popup mesaj alındı:", message);

    if (message.action === "newLog") {
      console.log("Yeni log alındı:", message.log);
      addLogEntry(message.log);
      // Hemen yanıt ver
      sendResponse({ received: true });
    }
    if (message.action === "connectionStatus") {
      updateConnectionStatus(message.status === "connected", message.message);
      // Hemen yanıt ver
      sendResponse({ received: true });
    }
    // true döndürerek asenkron yanıt vereceğimizi belirtiyoruz
    return true;
  });

  function addLogEntry(log) {
    const entry = document.createElement("div");
    entry.className = `log-entry ${log.level}`;
    entry.innerHTML = `
        <div><strong>${log.timestamp}</strong></div>
        <div><strong>${log.level}</strong> - ${log.logger}</div>
        <div>${log.message}</div>
    `;
    logsList.appendChild(entry);
    logsList.scrollTop = logsList.scrollHeight;
  }

  function addErrorLog(message) {
    const log = {
      timestamp: new Date().toLocaleTimeString(),
      level: "ERROR",
      logger: "LogViewer",
      message: message,
    };
    addLogEntry(log);
  }

  // Popup kapandığında bağlantıyı kapat
  window.addEventListener("unload", function () {
    if (eventSource) {
      eventSource.close();
    }
  });

  // Event listeners
  refreshBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "fetchLogs" });
    loadLogs();
  });

  autoRefreshToggle.addEventListener("change", (e) => {
    updateSettings({ autoRefresh: e.target.checked });
  });

  // Ayarları yükle
  async function loadSettings() {
    const { settings } = await chrome.storage.local.get(["settings"]);
    if (settings) {
      document.getElementById("autoRefresh").checked = settings.autoRefresh;
    }
  }

  // Ayarları güncelle
  function updateSettings(newSettings) {
    chrome.storage.local.get(["settings"], (result) => {
      const settings = { ...result.settings, ...newSettings };
      chrome.storage.local.set({ settings });
      chrome.runtime.sendMessage({
        action: "updateSettings",
        settings: settings,
      });
    });
  }

  // Logları yükle ve görüntüle
  async function loadLogs() {
    const { logs } = await chrome.storage.local.get(["logs"]);
    const logsList = document.getElementById("logsList");

    logsList.innerHTML = "";

    if (!logs || logs.length === 0) {
      logsList.innerHTML = '<div class="log-entry">Henüz log bulunmuyor.</div>';
      return;
    }

    logs.forEach((log) => {
      const logEntry = document.createElement("div");
      logEntry.className = `log-entry ${log.level.toLowerCase()}`;

      const timestamp = new Date(log.timestamp).toLocaleString();

      logEntry.innerHTML = `
              <div class="log-time">${timestamp}</div>
              <div class="log-message">${log.message}</div>
              ${
                log.details
                  ? `<div class="log-details">${log.details}</div>`
                  : ""
              }
          `;

      logsList.appendChild(logEntry);
    });
  }

  function updateStatus(message, status) {
    const statusElement = document.getElementById("connectionStatus");
    statusElement.textContent = message;
    statusElement.className = `status ${status}`;
  }

  // Sayfa yüklendiğinde kaydedilmiş URL'i getir
  chrome.storage.local.get(["serverUrl"], function (result) {
    console.log("Kaydedilmiş URL:", result.serverUrl);
    if (result.serverUrl) {
      serverUrlInput.value = result.serverUrl;
      // Otomatik bağlantıyı başlat
      startConnection(result.serverUrl);
    }
  });

  function startConnection(url) {
    console.log("Bağlantı başlatılıyor:", url);
    updateStatus("Bağlanıyor...", "connecting");

    chrome.runtime.sendMessage(
      {
        action: "startConnection",
        url: url,
      },
      function (response) {
        console.log("Bağlantı yanıtı:", response);
        if (response && response.success) {
          updateStatus("Bağlandı", "connected");
        } else {
          updateStatus(response?.error || "Bağlantı hatası!", "error");
        }
      },
    );
  }

  // Başlangıçta bağlantı durumunu kontrol et
  chrome.runtime.sendMessage(
    { action: "getConnectionStatus" },
    function (response) {
      if (response && response.isConnected) {
        updateStatus("Bağlı", "connected");
      } else {
        updateStatus("Bağlantı bekleniyor", "disconnected");
      }
    },
  );
});
