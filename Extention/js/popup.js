// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM vollständig geladen, initialisiere Popup...");
    
    // DOM-Elemente mit korrekten IDs
    const button = document.getElementById("check-btn");
    const status = document.getElementById("status");
    const infoText = document.getElementById("info-text");
    // Die ID wurde in der HTML geändert zu "check-text-span"
    const checkText = document.getElementById("check-text-span");
    const settingsBtn = document.getElementById("settings-btn");

    // Logge gefundene Elemente für die Fehlersuche
    console.log("Gefundene DOM-Elemente:", {
        button: !!button,
        status: !!status,
        infoText: !!infoText,
        checkText: !!checkText,
        settingsBtn: !!settingsBtn
    });

    let APIKey;
    let systemPrompt;
    let selectedLanguage = 'de'; // Standard-Sprache
    let uiTexts = {};

    // Sicherheitscheck für DOM-Elemente
    function checkDOMElements() {
        const elements = {
            button: document.getElementById("check-btn"),
            status: document.getElementById("status"),
            infoText: document.getElementById("info-text"),
            checkText: document.getElementById("check-text-span"),
            settingsBtn: document.getElementById("settings-btn")
        };
        
        let missingElements = [];
        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                missingElements.push(name);
                console.error(`Element nicht gefunden: ${name}`);
            }
        }
        
        if (missingElements.length > 0) {
            console.error("Fehlende DOM-Elemente: " + missingElements.join(", "));
            return false;
        }
        
        return true;
    }

    // Nur fortfahren, wenn alle DOM-Elemente vorhanden sind
    if (!checkDOMElements()) {
        console.error("Die Anwendung kann nicht vollständig gestartet werden, fehlende DOM-Elemente werden ignoriert.");
    }

    // Trotz fehlender Elemente fortfahren, wir haben Fallbacks eingebaut
    // Lade die UI-Texte aus der presets.json
    fetch('./presets.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Fehler! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.ui) {
                throw new Error("Ungültiges JSON-Format: UI-Texte fehlen");
            }
            // UI-Texte für alle Sprachen speichern
            uiTexts = data.ui;
            
            // Lade gespeicherte Einstellungen
            loadSettings();
        })
        .catch(error => {
            console.error("Fehler beim Laden der UI-Texte:", error);
            // Lade dennoch die Einstellungen, falls die Texte nicht geladen werden können
            loadSettings();
        });

    // Lade gespeicherte Einstellungen: API-Key, Sprache und System-Prompt
    function loadSettings() {
        chrome.storage.local.get(["apiKey", "systemPrompt", "selectedLanguage"], function (data) {
            if (data.apiKey) {
                APIKey = data.apiKey;
            } else {
                if (button) button.disabled = true;
            }
            
            // Sprache speichern
            selectedLanguage = data.selectedLanguage || 'de';
            
            // UI-Texte aktualisieren
            updateUITexts();
            
            // System-Prompt speichern oder Standard-Prompt verwenden
            if (data.systemPrompt) {
                systemPrompt = data.systemPrompt;
            } else {
                // Standard-Prompt (jetzt sprachunabhängig)
                systemPrompt = "You are a fact-checker who reviews texts and statements for accuracy. You analyze information carefully and provide an objective, precise assessment. You correct false statements with references to reliable sources and facts. You always reply in the same language as the original text.";
            }
        });
    }

    // UI-Texte entsprechend der ausgewählten Sprache aktualisieren
    function updateUITexts() {
        if (!uiTexts || !uiTexts[selectedLanguage] || !uiTexts[selectedLanguage].popup) {
            console.error("UI-Texte nicht verfügbar für Sprache: " + selectedLanguage);
            return;
        }
        
        const texts = uiTexts[selectedLanguage].popup;
        
        // Null-Prüfungen für alle DOM-Elemente
        if (infoText) infoText.textContent = texts.infoText;
        
        // Direkter Zugriff auf das Element, falls die Variable null ist
        const checkTextElement = checkText || document.getElementById("check-text-span");
        if (checkTextElement) checkTextElement.textContent = texts.checkButtonText;
        
        if (settingsBtn) settingsBtn.title = texts.settingsButtonTitle;
    }

    // Eventlistener für den Settings-Button hinzufügen
    const settingsBtnElement = settingsBtn || document.getElementById("settings-btn");
    if (settingsBtnElement) {
        settingsBtnElement.addEventListener("click", () => {
            window.location.href = './settings.html';
        });
    }

    // Eventlistener für den Check-Button hinzufügen
    const buttonElement = button || document.getElementById("check-btn");
    if (buttonElement) {
        buttonElement.onclick = async () => {
            // Text für "Wird geladen" basierend auf der gewählten Sprache
            const loadingText = uiTexts[selectedLanguage]?.popup?.loadingText || "Wird geladen...";
            const statusElement = status || document.getElementById("status");
            if (statusElement) statusElement.innerText = loadingText;
            if (buttonElement) buttonElement.disabled = true;

            // Holt den aktuellen Tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            let result;
            
            try {
                // Führt ein Skript auf der aktuellen Seite aus, um die Auswahl zu holen
                const [selection] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => getSelection().toString(),
                });
                result = selection.result;
                
                if (!result || result.trim() === '') {
                    // Kein Text ausgewählt
                    const noTextMsg = "Bitte wählen Sie zuerst Text auf der Webseite aus.";
                    if (statusElement) statusElement.innerText = noTextMsg;
                    if (buttonElement) buttonElement.disabled = false;
                    return;
                }
            } catch (e) {
                console.error("Fehler beim Abrufen der Auswahl:", e);
                
                // Fehlermeldung basierend auf der gewählten Sprache
                const errorText = uiTexts[selectedLanguage]?.popup?.errorText || "Fehler";
                if (statusElement) statusElement.innerText = errorText;
                if (buttonElement) buttonElement.disabled = false;
                return; // Fehlerbehandlung für nicht unterstützte Seiten
            }

            try {
                if (!APIKey) {
                    throw new Error("Kein API-Schlüssel vorhanden");
                }
                
                // Senden der Auswahl an OpenAI und Anzeigen des Ergebnisses
                const response = await queryOpenAI(result);
                
                if (!response) {
                    throw new Error("Keine Antwort von der API erhalten");
                }
                
                await navigator.clipboard.writeText(response);
                
                // "In die Zwischenablage kopiert" basierend auf der gewählten Sprache
                const copiedText = uiTexts[selectedLanguage]?.popup?.copiedText || "Antwort in die Zwischenablage kopiert";
                if (statusElement) statusElement.innerText = copiedText;
            } catch (e) {
                console.error("Fehler bei der Kommunikation mit OpenAI:", e);
                
                // Fehlermeldung basierend auf der gewählten Sprache
                const errorText = uiTexts[selectedLanguage]?.popup?.errorText || "Fehler";
                if (statusElement) statusElement.innerText = errorText;
            } finally {
                if (buttonElement) buttonElement.disabled = false;
            }
        };
    }

    async function queryOpenAI(prompt) {
        if (!APIKey) {
            throw new Error("API-Schlüssel fehlt");
        }
        
        if (!systemPrompt) {
            systemPrompt = "You are a fact-checker who reviews texts and statements for accuracy. You analyze information carefully and provide an objective assessment. You always reply in the same language as the original text.";
        }
        
        const url = 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + APIKey
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt },{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Ungültiges API-Antwortformat");
        }
        
        return data.choices[0].message.content;
    }
});