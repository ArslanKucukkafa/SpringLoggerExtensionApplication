document.addEventListener('DOMContentLoaded', () => {
    // UI elementlerini seç
    const logsList = document.getElementById('logsList');
    const refreshBtn = document.getElementById('refreshBtn');
    const autoRefreshToggle = document.getElementById('autoRefresh');
    const clearLogsBtn = document.getElementById('clearLogs');
    const toggleNotificationsBtn = document.getElementById('toggleNotifications');

    // Ayarları yükle
    loadSettings();
    
    // Logları yükle
    loadLogs();

    // Event listeners
    refreshBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'fetchLogs' });
        loadLogs();
    });

    autoRefreshToggle.addEventListener('change', (e) => {
        updateSettings({ autoRefresh: e.target.checked });
    });

    clearLogsBtn.addEventListener('click', () => {
        chrome.storage.local.set({ logs: [] });
        loadLogs();
    });

    toggleNotificationsBtn.addEventListener('click', async () => {
        const settings = await chrome.storage.local.get(['settings']);
        updateSettings({ 
            ...settings.settings,
            notificationsEnabled: !settings.settings.notificationsEnabled 
        });
    });
});

// Ayarları yükle
async function loadSettings() {
    const { settings } = await chrome.storage.local.get(['settings']);
    if (settings) {
        document.getElementById('autoRefresh').checked = settings.autoRefresh;
    }
}

// Ayarları güncelle
function updateSettings(newSettings) {
    chrome.storage.local.get(['settings'], (result) => {
        const settings = { ...result.settings, ...newSettings };
        chrome.storage.local.set({ settings });
        chrome.runtime.sendMessage({ 
            action: 'updateSettings',
            settings: settings
        });
    });
}

// Logları yükle ve görüntüle
async function loadLogs() {
    const { logs } = await chrome.storage.local.get(['logs']);
    const logsList = document.getElementById('logsList');
    
    logsList.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        logsList.innerHTML = '<div class="log-entry">Henüz log bulunmuyor.</div>';
        return;
    }

    logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${log.level.toLowerCase()}`;
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        logEntry.innerHTML = `
            <div class="log-time">${timestamp}</div>
            <div class="log-message">${log.message}</div>
            ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
        `;
        
        logsList.appendChild(logEntry);
    });
}
