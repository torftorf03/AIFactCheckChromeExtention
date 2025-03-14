const button = document.getElementById("save-btn")
const p = document.getElementById("status")
const toggleButton = document.getElementById("toggle-key");
const apiKeyContainer = document.getElementById("apiKeyContainer");
const input = document.getElementById("apiKeyInput");
const saveButton = document.getElementById("saveApiKey");

// Lade den gespeicherten API-Key
chrome.storage.local.get("apiKey", function (data) {
    if (data.apiKey) {
        input.value = data.apiKey;
    }else{
	button.disabled = true;
    }
});

// API-Key speichern
input.addEventListener("input", function () {
    chrome.storage.local.set({ apiKey: input.value });
    button.disabled = false;
});

// Ein-/Ausblenden der API-Key Eingabe
toggleButton.addEventListener("click", function () {
    if (apiKeyContainer.style.display === "none") {
        apiKeyContainer.style.display = "block";
        toggleButton.textContent = "API-Key Eingabe ausblenden";
    } else {
        apiKeyContainer.style.display = "none";
        toggleButton.textContent = "API-Key Eingabe anzeigen";
    }
});


button.onclick = async () => {
  p.innerText = "Loading";
  button.disabled = true;

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
  } catch (e) {
    console.error("Fehler beim Abrufen der Auswahl:", e);
    p.innerText = "Error";
    button.disabled = false;
    return; // Fehlerbehandlung für nicht unterstützte Seiten
  }

  try {
    // Senden der Auswahl an OpenAI und Anzeigen des Ergebnisses
    const response = await queryOpenAI(result);
    await navigator.clipboard.writeText(response);
    p.innerText = "Copied Response to clipboard";
  } catch (e) {
    console.error("Fehler bei der Kommunikation mit OpenAI:", e);
    p.innerText = "Error";
  } finally {
    button.disabled = false;
  }
};





async function queryOpenAI(prompt) {
    const apiKey = input.value;
    const url = 'https://api.openai.com/v1/chat/completions';
    const systempromt2 = "Du bist ein Fakten Checker der eine Chat Nachricht oder ein Verlauf erhält und die getätigten aussagen überprüft. Wenn du auf eine Aussage stößt die falsch ist, schreibst du eine Antwort darauf. In dieser Argumentierst du fachlich und anschaulich was an der Aussage nicht stimmt und korrigierst sie. Begebe dich bitte sprachlich auf ein ähnliches Level die ursprünglichen Nachrichten, werde dabei aber nie überheblich oder herablassend"



    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systempromt2 },{ role: 'user', content: prompt }],
            max_tokens: 100
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}