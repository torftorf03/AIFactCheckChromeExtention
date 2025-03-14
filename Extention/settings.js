const saveButton = document.getElementById("save");
const input = document.getElementById("apiKeyInput");

saveButton.addEventListener("click" ,() => {
    chrome.storage.local.set({ apiKey: input.value });
    window.location.href = '/popup.html';
})

chrome.storage.local.get("apiKey", function (data) {
    if (data.apiKey) {
        input.value = data.apiKey;
    }
});
