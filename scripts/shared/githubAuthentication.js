// Use global config injected via scripts/shared/config.js

const startGitHubOAuthProcess = {
  
    init() {
      this.githubUserToken = 'githubAccessToken';
      this.OAuthClientID = (window.croSSyncConfig || {}).OAuthClientID;
      this.githubOAuthURL = 'https://github.com/login/oauth/authorize';
      this.githubRedirectURL = 'https://github.com/bavish007/croSSync';
    },

    githubOAuth() {
      this.init(); 
  
      // Note: redirect_uri= was missing '=' previously
      let url = `${this.githubOAuthURL}?client_id=${encodeURIComponent(this.OAuthClientID)}&redirect_uri=${encodeURIComponent(this.githubRedirectURL)}&scope=repo`;
  
      chrome.storage.local.set({ pipeFlag: true }, () => {
        chrome.tabs.create({ url, active: true }, function () {
          window.close();
        });
      });
    },
  };

// Expose to window for popup/index usage
window.startGitHubOAuthProcess = startGitHubOAuthProcess;