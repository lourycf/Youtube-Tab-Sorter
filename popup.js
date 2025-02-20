document.getElementById("sortTabs").addEventListener("click", () => {
    // Send a message to the background script
    chrome.runtime.sendMessage({ action: "sortAndReopenTabs" });
  });