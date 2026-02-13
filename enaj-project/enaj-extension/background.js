// Enaj Background Service Worker
// Handles extension install and badge updates

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open popup on first install so user sets up profile
    chrome.storage.local.get("enajProfile", (data) => {
      if (!data.enajProfile) {
        // Set badge to indicate setup needed
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#81D8D0" });
      }
    });
  }
});

// Listen for messages from popup to inject content script on demand
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ error: "No active tab found" });
        return;
      }

      const tab = tabs[0];

      // First try sending message to existing content script
      chrome.tabs.sendMessage(tab.id, { action: "scrapeProduct" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded — inject it dynamically
          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, files: ["content-script.js"] },
            () => {
              if (chrome.runtime.lastError) {
                sendResponse({ error: "Cannot scan this page. Try a supported shopping site." });
                return;
              }
              // Now send the scrape message
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: "scrapeProduct" }, (resp) => {
                  if (chrome.runtime.lastError || !resp) {
                    sendResponse({ error: "Could not read this page." });
                  } else {
                    sendResponse(resp);
                  }
                });
              }, 300);
            }
          );
        } else {
          sendResponse(response);
        }
      });
    });
    return true; // keep channel open for async
  }

  if (request.action === "profileComplete") {
    // Clear the setup badge
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ success: true });
  }
});
