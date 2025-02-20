// Function to extract video length from a YouTube tab
async function getVideoLength(tabId) {
    try {
      console.log(`Extracting video length from tab ${tabId}`);
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Log the entire document to debug
          console.log("YouTube page DOM:", document.documentElement.innerHTML);
          const lengthElement = document.querySelector(".ytp-time-duration");
          if (!lengthElement) {
            console.error("Video duration element not found");
            return null;
          }
          return lengthElement.innerText;
        },
      });
      console.log(`Video length extracted: ${result[0].result}`);
      return result[0].result;
    } catch (error) {
      console.error("Error extracting video length:", error);
      return null;
    }
  }
  
  // Function to convert time string (e.g., "10:30") to seconds
  function timeToSeconds(time) {
    const parts = time.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }
  
  // Main function to sort and reopen tabs
  async function sortAndReopenTabs() {
    console.log("Fetching YouTube tabs...");
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/watch*" });
    console.log(`Found ${tabs.length} YouTube tabs`);
  
    const tabData = [];
  
    // Extract video lengths and store tab data
    for (const tab of tabs) {
      console.log(`Processing tab ${tab.id}: ${tab.url}`);
      const length = await getVideoLength(tab.id);
      if (length) {
        console.log(`Video length: ${length}`);
        tabData.push({
          id: tab.id,
          url: tab.url,
          length: timeToSeconds(length),
        });
      } else {
        console.log(`Skipping tab ${tab.id} (no video length found)`);
      }
    }
  
    // Sort tabs by video length
    tabData.sort((a, b) => a.length - b.length);
    console.log("Sorted tabs:", tabData);
  
    // Close all YouTube tabs
    for (const tab of tabData) {
      console.log(`Closing tab ${tab.id}`);
      await chrome.tabs.remove(tab.id);
    }
  
    // Reopen tabs in sorted order
    for (const tab of tabData) {
      console.log(`Reopening tab: ${tab.url}`);
      await chrome.tabs.create({ url: tab.url });
    }
  }
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sortAndReopenTabs") {
      sortAndReopenTabs().then(() => sendResponse({ success: true }));
      return true; // Required to use sendResponse asynchronously
    }
  });