// API endpoint'i
const API_ENDPOINT = 'http://localhost:8080/api/logs';

// Varsayılan ayarlar
const DEFAULT_SETTINGS = {
    notificationsEnabled: true
};

// Ayarları yükle
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['settings'], (result) => {
        if (!result.settings) {
            chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
        }
    });
});

// Log mesajını gönder
async function sendLog(log) {
    try {
        await fetch(`${API_ENDPOINT}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(log)
        });
    } catch (error) {
        console.error('Log gönderme hatası:', error);
    }
}

// Bildirim göster
function showNotification(log) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: `${log.level} Log`,
        message: log.message
    });
}

// Mesaj dinleyicisi
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendLog') {
        sendLog(request.log);
    }
});
