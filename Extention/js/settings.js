// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM vollständig geladen, initialisiere Einstellungen...");
    
    const saveButton = document.getElementById("save");
    const input = document.getElementById("apiKeyInput");
    const presetSelect = document.getElementById("presetSelect");
    const languageSelect = document.getElementById("languageSelect");
    const presetDescription = document.getElementById("presetDescription");
    const settingsTitle = document.getElementById("settings-title");
    const apiKeyLabel = document.getElementById("apiKey-label");
    const languageLabel = document.getElementById("language-label");
    const presetLabel = document.getElementById("preset-label");
    // Die ID wurde in der HTML zu save-text-span geändert
    const saveText = document.getElementById("save-text-span");
    const backButton = document.getElementById("back-btn");

    // Logge gefundene Elemente für die Fehlersuche
    console.log("Gefundene DOM-Elemente:", {
        saveButton: !!saveButton,
        input: !!input,
        presetSelect: !!presetSelect,
        languageSelect: !!languageSelect,
        presetDescription: !!presetDescription,
        settingsTitle: !!settingsTitle,
        apiKeyLabel: !!apiKeyLabel,
        languageLabel: !!languageLabel,
        presetLabel: !!presetLabel,
        saveText: !!saveText,
        backButton: !!backButton
    });

    let configData = {};
    let selectedLanguage = 'de'; // Standardsprache

    // Funktion zur Erkennung der Browsersprache und Auswahl der entsprechenden Sprache
    function detectBrowserLanguage() {
        // Browsersprache abrufen
        const browserLang = navigator.language.toLowerCase();
        console.log("Erkannte Browsersprache:", browserLang);
        
        // Prüfen, ob die Sprache Deutsch oder Englisch ist, sonst Englisch als Standard
        if (browserLang.startsWith('de')) {
            return 'de';
        } else if (browserLang.startsWith('en')) {
            return 'en';
        } else {
            return 'en'; // Standardsprache für alle anderen Sprachen ist Englisch
        }
    }

    // Sicherheitscheck für DOM-Elemente
    function checkDOMElements() {
        const elements = {
            saveButton: document.getElementById("save"),
            input: document.getElementById("apiKeyInput"),
            presetSelect: document.getElementById("presetSelect"),
            languageSelect: document.getElementById("languageSelect"),
            presetDescription: document.getElementById("presetDescription"),
            settingsTitle: document.getElementById("settings-title"),
            apiKeyLabel: document.getElementById("apiKey-label"),
            languageLabel: document.getElementById("language-label"),
            presetLabel: document.getElementById("preset-label"),
            saveText: document.getElementById("save-text-span"),
            backButton: document.getElementById("back-btn")
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
    // Laden der Konfigurationsdaten (Presets und UI-Texte) aus der JSON-Datei
    // Korrekten Pfad zur JSON-Datei verwenden (mit führendem Punkt)
    fetch('./presets.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Fehler! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.presets || !data.languages || !data.ui) {
                throw new Error("Ungültiges JSON-Format: Erforderliche Daten fehlen");
            }
            
            configData = data;
            
            // Sprachen-Dropdown befüllen
            for (const [langCode, langName] of Object.entries(configData.languages)) {
                const option = document.createElement('option');
                option.value = langCode;
                option.textContent = langName;
                languageSelect.appendChild(option);
            }
            
            // Gespeicherte Sprache laden oder Browsersprache erkennen
            chrome.storage.local.get(["selectedLanguage", "selectedPreset"], function (data) {
                if (data.selectedLanguage) {
                    // Wenn bereits eine Sprache ausgewählt wurde, diese verwenden
                    selectedLanguage = data.selectedLanguage;
                } else {
                    // Beim ersten Start die Browsersprache erkennen und verwenden
                    selectedLanguage = detectBrowserLanguage();
                    // Die erkannte Sprache in der Speicher ablegen
                    chrome.storage.local.set({ selectedLanguage: selectedLanguage });
                    console.log("Browsersprache erkannt und gesetzt:", selectedLanguage);
                }
                
                // Sprache im Dropdown aktualisieren
                languageSelect.value = selectedLanguage;
                
                // UI-Texte entsprechend der ausgewählten Sprache aktualisieren
                updateUITexts(selectedLanguage);
                
                // Presets laden (jetzt unabhängig von der UI-Sprache)
                loadPresets();
                
                // Gespeichertes Preset auswählen, falls vorhanden
                if (data.selectedPreset) {
                    presetSelect.value = data.selectedPreset;
                    updatePresetDescription(data.selectedPreset);
                }
            });
        })
        .catch(error => {
            console.error('Fehler beim Laden der Konfigurationsdaten:', error);
            // Zeige Fehlermeldung auf der Oberfläche an
            if (settingsTitle) {
                settingsTitle.textContent = "Fehler beim Laden der Einstellungen";
                settingsTitle.style.color = "red";
            }
        });

    // Presets laden (unabhängig von der UI-Sprache)
    function loadPresets() {
        if (!configData || !configData.presets) {
            console.error('Keine Presets gefunden!');
            return;
        }
        
        // Preset-Dropdown leeren
        presetSelect.innerHTML = '';
        
        // Alle Presets laden
        const presets = configData.presets;
        
        // Dropdown mit Presets befüllen
        for (const [key, preset] of Object.entries(presets)) {
            if (preset && preset.name && preset.name[selectedLanguage]) {
                const option = document.createElement('option');
                option.value = key;
                // Name des Presets in der ausgewählten Sprache anzeigen
                option.textContent = preset.name[selectedLanguage];
                presetSelect.appendChild(option);
            }
        }
        
        // Standardmäßig das erste Preset auswählen
        if (presetSelect.options.length > 0) {
            const firstPresetKey = presetSelect.options[0].value;
            presetSelect.value = firstPresetKey;
            updatePresetDescription(firstPresetKey);
        }
    }

    // UI-Texte entsprechend der ausgewählten Sprache aktualisieren
    function updateUITexts(langCode) {
        if (!configData || !configData.ui || !configData.ui[langCode] || !configData.ui[langCode].settings) {
            console.error(`UI-Texte nicht gefunden für Sprache: ${langCode}`);
            return;
        }
        
        const uiTexts = configData.ui[langCode].settings;
        
        if (settingsTitle) settingsTitle.textContent = uiTexts.title;
        if (apiKeyLabel) apiKeyLabel.textContent = uiTexts.apiKeyLabel;
        if (languageLabel) languageLabel.textContent = uiTexts.languageLabel;
        if (presetLabel) presetLabel.textContent = uiTexts.presetLabel;
        
        // Die ID wurde in der HTML zu save-text-span geändert
        const saveTextElement = saveText || document.getElementById("save-text-span");
        if (saveTextElement) saveTextElement.textContent = uiTexts.saveButton;
        
        if (backButton) backButton.title = uiTexts.backButton;
        if (input) input.placeholder = uiTexts.apiKeyPlaceholder;
        
        // Aktualisieren aller Preset-Namen in der neuen Sprache
        updatePresetNames();
    }

    // Preset-Namen in der aktuellen Sprache aktualisieren
    function updatePresetNames() {
        if (!configData || !configData.presets || !presetSelect) {
            return;
        }
        
        const presets = configData.presets;
        
        // Für jede Option im Dropdown den Namen in der neuen Sprache setzen
        Array.from(presetSelect.options).forEach(option => {
            const presetKey = option.value;
            if (presets[presetKey] && presets[presetKey].name && presets[presetKey].name[selectedLanguage]) {
                option.textContent = presets[presetKey].name[selectedLanguage];
            }
        });
    }

    // Bei Änderung der Sprache
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            selectedLanguage = this.value;
            updateUITexts(selectedLanguage);
            if (presetSelect && presetSelect.value) {
                updatePresetDescription(presetSelect.value);
            }
        });
    }

    // Beschreibung bei Änderung des Presets aktualisieren
    if (presetSelect) {
        presetSelect.addEventListener('change', function() {
            updatePresetDescription(this.value);
        });
    }

    // Beschreibungstext aktualisieren
    function updatePresetDescription(presetKey) {
        if (!configData || !configData.presets || !presetDescription) {
            return;
        }
        
        if (configData.presets[presetKey] && 
            configData.presets[presetKey].description && 
            configData.presets[presetKey].description[selectedLanguage]) {
            presetDescription.textContent = configData.presets[presetKey].description[selectedLanguage];
        } else {
            presetDescription.textContent = '';
        }
    }

    // Speichern der Einstellungen
    if (saveButton) {
        saveButton.addEventListener("click", () => {
            if (!configData || !configData.presets || !presetSelect || !presetSelect.value) {
                console.error("Kann Einstellungen nicht speichern: Presets oder Auswahl fehlt");
                return;
            }
            
            const selectedPreset = presetSelect.value;
            
            // Überprüfen, ob das ausgewählte Preset existiert und einen systemPrompt hat
            if (!configData.presets[selectedPreset] || !configData.presets[selectedPreset].systemPrompt) {
                console.error(`System-Prompt nicht gefunden für Preset: ${selectedPreset}`);
                // Standardprompt als Fallback verwenden
                const defaultPrompt = "You are a fact-checker who reviews statements for accuracy. You analyze information carefully and provide an objective assessment. You always reply in the same language as the original text.";
                
                chrome.storage.local.set({ 
                    apiKey: input.value,
                    selectedLanguage: selectedLanguage,
                    selectedPreset: selectedPreset,
                    systemPrompt: defaultPrompt
                });
            } else {
                const systemPrompt = configData.presets[selectedPreset].systemPrompt;
                
                chrome.storage.local.set({ 
                    apiKey: input.value,
                    selectedLanguage: selectedLanguage,
                    selectedPreset: selectedPreset,
                    systemPrompt: systemPrompt
                });
            }
            
            window.location.href = './popup.html';
        });
    }

    // Laden des gespeicherten API-Schlüssels
    chrome.storage.local.get("apiKey", function (data) {
        if (data.apiKey && input) {
            input.value = data.apiKey;
        }
    });

    // Zurück-Button
    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = './popup.html';
        });
    }
});
