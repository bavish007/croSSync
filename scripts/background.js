chrome.storage.local.set({
  'darkmodeFlag': 0
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // GFG-specific messages
    if (request.type === 'getUserSolution' && sender?.tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['scripts/platforms/geeksForGeeks/extractCode.js'],
        world: 'MAIN',
      });
      try { sendResponse({ status: true }); } catch(_) {}
    }

    if (request.type === 'deleteNode' && sender?.tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['scripts/platforms/geeksForGeeks/nodeDeletion.js'],
        world: 'MAIN',
      });
      try { sendResponse({ status: true }); } catch(_) {}
    }

    // LeetCode-specific messages
    if (request.type === 'set-fire-icon') {
        chrome.action.setIcon(
          { path: 'assets/logo48.png' },
          () => {
            setTimeout(() => {
              chrome.action.setIcon({ path: 'assets/logo128.png' });
            }, 5000);
          }
        );
        try { sendResponse({ status: 'OK' }); } catch(_) {}
    }

    // Common messages
    if (request && request.removeCurrentTab === true && request.AuthenticationSuccessful === true) {
      chrome.storage.local.set({ githubUsername: request.githubUsername }, () => {});
      chrome.storage.local.set({ githubAccessToken: request.accessToken }, () => {});
      chrome.storage.local.set({ pipeFlag: false }, () => {});
      // Default to link_repo_and_solve until the user links their repo
      chrome.storage.local.set({ current_phase: 'link_repo_and_solve' }, () => {});
      // Try to focus the popup if open; otherwise open index.html
      chrome.action.openPopup?.();
    } else if (request && request.removeCurrentTab === true && request.AuthenticationSuccessful === false) {
  const failedURL = chrome.runtime.getURL('html/index.html') + '?auth=failed';
      chrome.tabs.create({ url: failedURL, active: true });
    }
  }
);

// LeetCode cookie and web request logic
chrome.cookies.get({ name: 'LEETCODE_SESSION', url: 'https://leetcode.com/' }, function (cookie) {
  if (cookie) {
    chrome.storage.sync.set({ leetcode_session: cookie.value }, () => {
      console.log(`Leetcode Synced Successfully`);
    });
  }
});

chrome.cookies.onChanged.addListener(function (info) {
  const { cookie } = info;
  if (cookie.name === 'LEETCODE_SESSION') {
    chrome.storage.sync.set({ leetcode_session: cookie?.value || null }, () => {
      console.log(`Leetcode Re-Synced Successfully`);
    });
  }
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (
      details.method === 'POST' &&
      details.url.startsWith('https://leetcode.com/problems/') &&
      details.url.includes('/submit/')
    ) {
      const questionSlug = details.url.match(/\/problems\/(.*)\/submit/)?.[1] ?? null;
      if (questionSlug) {
        setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'get-submission', data: { questionSlug } });
            }
          });
        }, 5000); // Wait 5 seconds for submission to be processed
      }
    }
  },
  { urls: ["https://leetcode.com/problems/*/submit/*", "https://leetcode.com/problems/*/submit"] }
);