// Überprüfe, ob der Browser im hellen oder dunklen Modus ist
const isLightMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

// Füge Event-Listener hinzu, um auf Änderungen des Farbschemas zu reagieren
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
    const newIsLightMode = event.matches;
    applyTheme(newIsLightMode);
});

// Funktion zum Anwenden des entsprechenden Themes
function applyTheme(isLight) {
    const body = document.querySelector('body');
    const alertBoxes = document.querySelectorAll('.alert');
    
    if (isLight) {
        // Helles Theme anwenden
        body.classList.remove('bg-dark', 'text-light');
        body.classList.add('bg-light', 'text-dark');
        
        // Andere UI-Elemente anpassen
        const buttons = document.querySelectorAll('.btn-outline-light');
        buttons.forEach(btn => {
            btn.classList.remove('btn-outline-light');
            btn.classList.add('btn-outline-dark');
        });
        
        alertBoxes.forEach(alertBox => {
            if (alertBox.classList.contains('alert-info')) {
                alertBox.classList.remove('alert-info');
                alertBox.classList.add('alert-primary');
            }
        });
    } else {
        // Dunkles Theme anwenden
        body.classList.remove('bg-light', 'text-dark');
        body.classList.add('bg-dark', 'text-light');
        
        // Andere UI-Elemente anpassen
        const buttons = document.querySelectorAll('.btn-outline-dark');
        buttons.forEach(btn => {
            btn.classList.remove('btn-outline-dark');
            btn.classList.add('btn-outline-light');
        });
        
        alertBoxes.forEach(alertBox => {
            if (alertBox.classList.contains('alert-primary')) {
                alertBox.classList.remove('alert-primary');
                alertBox.classList.add('alert-info');
            }
        });
    }
}

// Initial das Theme anwenden
applyTheme(isLightMode);

// Überprüfe, ob die Sprache Deutsch oder Englisch ist
const isGerman = navigator.language.startsWith('de');

// Funktion zum Anwenden der entsprechenden Sprache
function applyLanguage(isGerman) {
    const elements = {
        title: document.querySelector('title'),
        settingsBtn: document.querySelector('#settings-btn'),
        infoText: document.querySelector('.alert .fw-bold'),
        checkBtn: document.querySelector('#check-btn'),
        backBtn: document.querySelector('#back-btn'),
        settingsTitle: document.querySelector('.settings-title'),
        apiKeyLabel: document.querySelector('label[for="apiKeyInput"]'),
        apiKeyInput: document.querySelector('#apiKeyInput'),
        saveBtn: document.querySelector('#save'),
        footerText: document.querySelector('.footer p')
    };
    
    if (isGerman) {
        // Deutsche Texte
        if (elements.title) elements.title.textContent = 'AI Fact Check';
        if (elements.settingsBtn) elements.settingsBtn.setAttribute('title', 'Einstellungen');
        if (elements.infoText) elements.infoText.textContent = 'Markieren Sie Text auf einer Webseite und klicken Sie auf "Überprüfen", um die Fakten zu prüfen.';
        if (elements.checkBtn) {
            const icon = elements.checkBtn.querySelector('i');
            elements.checkBtn.innerHTML = '';
            elements.checkBtn.appendChild(icon);
            elements.checkBtn.appendChild(document.createTextNode('Überprüfen'));
        }
        if (elements.backBtn) elements.backBtn.setAttribute('title', 'Zurück');
        if (elements.settingsTitle) elements.settingsTitle.textContent = 'Einstellungen';
        if (elements.apiKeyLabel) elements.apiKeyLabel.textContent = 'OpenAI API-Schlüssel:';
        if (elements.apiKeyInput) elements.apiKeyInput.setAttribute('placeholder', 'API-Schlüssel eingeben');
        if (elements.saveBtn) {
            const icon = elements.saveBtn.querySelector('i');
            elements.saveBtn.innerHTML = '';
            elements.saveBtn.appendChild(icon);
            elements.saveBtn.appendChild(document.createTextNode('Speichern'));
        }
        if (elements.footerText) elements.footerText.textContent = 'Powered by OpenAI';
    } else {
        // Englische Texte
        if (elements.title) elements.title.textContent = 'AI Fact Check';
        if (elements.settingsBtn) elements.settingsBtn.setAttribute('title', 'Settings');
        if (elements.infoText) elements.infoText.textContent = 'Select text on a webpage and click "Check" to verify the facts.';
        if (elements.checkBtn) {
            const icon = elements.checkBtn.querySelector('i');
            elements.checkBtn.innerHTML = '';
            elements.checkBtn.appendChild(icon);
            elements.checkBtn.appendChild(document.createTextNode('Check'));
        }
        if (elements.backBtn) elements.backBtn.setAttribute('title', 'Back');
        if (elements.settingsTitle) elements.settingsTitle.textContent = 'Settings';
        if (elements.apiKeyLabel) elements.apiKeyLabel.textContent = 'OpenAI API Key:';
        if (elements.apiKeyInput) elements.apiKeyInput.setAttribute('placeholder', 'Enter API key');
        if (elements.saveBtn) {
            const icon = elements.saveBtn.querySelector('i');
            elements.saveBtn.innerHTML = '';
            elements.saveBtn.appendChild(icon);
            elements.saveBtn.appendChild(document.createTextNode('Save'));
        }
        if (elements.footerText) elements.footerText.textContent = 'Powered by OpenAI';
    }
}

// Initial die Sprache anwenden
applyLanguage(isGerman);

// Event-Listener hinzufügen, der beim Laden der Seite ausgeführt wird
document.addEventListener('DOMContentLoaded', function() {
    applyTheme(isLightMode);
    applyLanguage(isGerman);
});