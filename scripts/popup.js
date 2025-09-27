// ===== croSSync - Professional Popup UI Controller =====

class PopupController {
  constructor() {
    this.isInitialized = false;
    this.currentPhase = null;
    this.settingsOpen = false;
    this.animationDuration = 300;
    
    // Bind methods to preserve context
    this.init = this.init.bind(this);
    this.showPhase = this.showPhase.bind(this);
    this.hidePhase = this.hidePhase.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  // Utility Methods
  $(id) {
    return document.getElementById(id);
  }

  show(id, animationClass = 'fade-in') {
    const el = this.$(id);
    if (!el) return;
    
    el.classList.remove('hidden');
    el.classList.add(animationClass);
    
    // Remove animation class after animation completes
    setTimeout(() => {
      el.classList.remove(animationClass);
    }, this.animationDuration);
  }

  hide(id) {
    const el = this.$(id);
    if (!el) return;
    
    el.classList.add('hidden');
    el.classList.remove('fade-in', 'slide-up', 'scale-in');
  }

  setText(id, text) {
    const el = this.$(id);
    if (el) el.textContent = text || '';
  }

  setHtml(id, html) {
    const el = this.$(id);
    if (el) el.innerHTML = html || '';
  }

  // Enhanced Alert System
  showAlert(type, message, duration = 5000) {
    const alertId = type === 'success' ? 'success_acknowledgement' : 'error_info';
    const alertEl = this.$(alertId);
    
    if (!alertEl) return;
    
    // Clear any existing timeout
    if (alertEl._timeout) {
      clearTimeout(alertEl._timeout);
    }
    
    alertEl.textContent = message;
    alertEl.classList.remove('hidden');
    alertEl.classList.add('fade-in');
    
    // Auto-hide after duration
    if (duration > 0) {
      alertEl._timeout = setTimeout(() => {
        alertEl.classList.add('hidden');
      }, duration);
    }
  }

  showSuccess(message, duration = 5000) {
    this.showAlert('success', message, duration);
    // Hide error if showing success
    const errorEl = this.$('error_info');
    if (errorEl) errorEl.classList.add('hidden');
  }

  showError(message, duration = 8000) {
    this.showAlert('error', message, duration);
    // Hide success if showing error
    const successEl = this.$('success_acknowledgement');
    if (successEl) successEl.classList.add('hidden');
  }

  // Phase Management with Smooth Transitions
  async showPhase(phaseId, animationClass = 'fade-in') {
    // Hide all phases first
    const phases = ['authentication_phase', 'link_repo_phase', 'solve_and_push_phase'];
    phases.forEach(phase => {
      if (phase !== phaseId) {
        this.hide(phase);
      }
    });

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show the target phase
    this.show(phaseId, animationClass);
    this.currentPhase = phaseId;
    
    // Update settings visibility
    const settingsTrigger = this.$('settings-trigger');
    if (settingsTrigger) {
      if (phaseId === 'solve_and_push_phase') {
        settingsTrigger.classList.remove('hidden');
      } else {
        settingsTrigger.classList.add('hidden');
      }
    }
  }

  hidePhase(phaseId) {
    this.hide(phaseId);
  }

  // Statistics Update with Animation
  updateStats(stats) {
    if (!stats) return;
    
    const mapping = [
      ['total_successful_submissions', 'solved'],
      ['successful_submissions_school', 'school'],
      ['successful_submissions_basic', 'basic'],
      ['successful_submissions_easy', 'easy'],
      ['successful_submissions_medium', 'medium'],
      ['successful_submissions_hard', 'hard'],
    ];

    mapping.forEach(([elementId, statKey], index) => {
      const el = this.$(elementId);
      if (el && statKey in stats) {
        // Add staggered animation delay
        setTimeout(() => {
          this.animateNumber(el, parseInt(el.textContent) || 0, stats[statKey]);
        }, index * 100);
      }
    });
  }

  // Number Animation
  animateNumber(element, from, to, duration = 1000) {
    if (from === to) {
      element.textContent = to;
      return;
    }

    const startTime = performance.now();
    const difference = to - from;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(from + (difference * easedProgress));
      
      element.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  // Repository Link Update
  updateRepoLink(linkedRepo) {
    if (!linkedRepo) {
      this.setText('repository_link', 'No repository linked');
      return;
    }
    
    this.setHtml(
      'repository_link',
      `<a target="_blank" href="https://github.com/${linkedRepo}">${linkedRepo}</a>`
    );
  }

  // Settings Menu Management
  toggleSettings() {
    const settingsMenu = this.$('settings-menu');
    if (!settingsMenu) return;

    this.settingsOpen = !this.settingsOpen;
    
    if (this.settingsOpen) {
      settingsMenu.classList.add('active');
    } else {
      settingsMenu.classList.remove('active');
    }
  }

  closeSettings() {
    const settingsMenu = this.$('settings-menu');
    if (settingsMenu) {
      settingsMenu.classList.remove('active');
      this.settingsOpen = false;
    }
  }

  // Loading State Management
  setLoading(elementId, isLoading = true) {
    const el = this.$(elementId);
    if (!el) return;

    if (isLoading) {
      el.classList.add('loading');
      el.disabled = true;
    } else {
      el.classList.remove('loading');
      el.disabled = false;
    }
  }

  // Phase Initialization
  async initPhases() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['githubAccessToken', 'current_phase', 'github_LinkedRepository', 'userStatistics'], async (res) => {
        const accessToken = res?.githubAccessToken;
        
        if (!accessToken) {
          await this.showPhase('authentication_phase', 'fade-in');
          resolve();
          return;
        }

        // Verify token validity
        try {
          const response = await this.verifyGitHubToken(accessToken);
          if (!response.ok) {
            throw new Error('Invalid token');
          }

          const user = await response.json();
          this.updateUserInfo(user.login);

          // Determine which phase to show
          const phase = res?.current_phase;
          if (phase === 'solve_and_push' && res?.github_LinkedRepository) {
            await this.showPhase('solve_and_push_phase', 'scale-in');
            if (res.userStatistics) this.updateStats(res.userStatistics);
            this.updateRepoLink(res.github_LinkedRepository);
          } else {
            await this.showPhase('link_repo_phase', 'slide-up');
          }
        } catch (error) {
          // Token invalid, clear it and show auth
          chrome.storage.local.set({ githubAccessToken: null });
          await this.showPhase('authentication_phase', 'fade-in');
        }
        
        resolve();
      });
    });
  }

  // GitHub Token Verification
  verifyGitHubToken(token) {
    return fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }

  // Update User Info
  updateUserInfo(username) {
    const elements = ['username_placeholder', 'username_placeholder_solve'];
    elements.forEach(id => {
      const el = this.$(id);
      if (el) {
        if (id === 'username_placeholder') {
          el.textContent = `Welcome, ${username}!`;
        } else {
          el.textContent = username;
        }
      }
    });
  }

  // Repository Operations
  async createRepository(repositoryName, accessToken) {
    this.setLoading('link-btn', true);
    
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: repositoryName, 
          private: true,
          description: 'Automatically synced coding solutions from croSSync extension'
        })
      });

      if (response.status === 201) {
        chrome.storage.local.set({ 
          github_LinkedRepository: repositoryName, 
          current_phase: 'solve_and_push' 
        });
        
        this.showSuccess(`Repository "${repositoryName}" created and linked successfully!`);
        
        // Transition to dashboard after a short delay
        setTimeout(() => {
          this.showPhase('solve_and_push_phase', 'scale-in');
          this.updateRepoLink(repositoryName);
        }, 2000);
        
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to create repository.';
        
        if (response.status === 422 && errorData.errors?.[0]?.message) {
          errorMessage = errorData.errors[0].message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        this.showError(errorMessage);
      }
    } catch (error) {
      this.showError('Network error. Please check your connection and try again.');
    } finally {
      this.setLoading('link-btn', false);
    }
  }

  async linkExistingRepository(repositoryName) {
    this.setLoading('link-btn', true);
    
    try {
      chrome.storage.local.set({ 
        github_LinkedRepository: repositoryName, 
        current_phase: 'solve_and_push' 
      });
      
      this.showSuccess(`Repository "${repositoryName}" linked successfully!`);
      
      // Transition to dashboard after a short delay
      setTimeout(() => {
        this.showPhase('solve_and_push_phase', 'scale-in');
        this.updateRepoLink(repositoryName);
      }, 2000);
      
    } catch (error) {
      this.showError('Failed to link repository. Please try again.');
    } finally {
      this.setLoading('link-btn', false);
    }
  }

  // Event Handlers
  wireEvents() {
    // Authentication
    const authBtn = this.$('authentication_button');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        const proc = window.startGitHubOAuthProcess;
        if (proc?.githubOAuth) {
          this.setLoading('authentication_button', true);
          proc.githubOAuth();
        }
      });
    }

    // Repository Linking
    const linkBtn = this.$('link-btn');
    if (linkBtn) {
      linkBtn.addEventListener('click', async () => {
        const repoInput = this.$('repositoryNameTextField');
        const repositoryName = repoInput?.value?.trim();
        
        if (!repositoryName) {
          this.showError('Please enter a repository name');
          repoInput?.focus();
          return;
        }

        const checked = document.querySelector('input[name="radio"]:checked');
        const isNew = checked?.value === 'new_repo';

        if (isNew) {
          const tokenRes = await new Promise(resolve => {
            chrome.storage.local.get('githubAccessToken', resolve);
          });
          
          if (tokenRes?.githubAccessToken) {
            await this.createRepository(repositoryName, tokenRes.githubAccessToken);
          } else {
            this.showError('Authentication required. Please reconnect your GitHub account.');
          }
        } else {
          await this.linkExistingRepository(repositoryName);
        }
      });
    }

    // Platform Handles
    const saveHandlesBtn = this.$('save-handles');
    if (saveHandlesBtn) {
      saveHandlesBtn.addEventListener('click', () => {
        const gfg = this.$('gfgHandle')?.value?.trim() || '';
        const lc = this.$('leetcodeHandle')?.value?.trim() || '';
        
        chrome.storage.local.set({ gfgHandle: gfg, leetcodeHandle: lc }, () => {
          this.showSuccess('Platform handles saved successfully!', 3000);
        });
      });
    }

    // Settings Menu
    const settingsTrigger = this.$('settings-trigger');
    if (settingsTrigger) {
      settingsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSettings();
      });
    }

    // Settings Menu Items
    const unlinkRepoSettings = this.$('unlink-repo-settings');
    if (unlinkRepoSettings) {
      unlinkRepoSettings.addEventListener('click', () => {
        this.handleUnlinkRepository();
        this.closeSettings();
      });
    }

    const clearHandlesSettings = this.$('clear-handles-settings');
    if (clearHandlesSettings) {
      clearHandlesSettings.addEventListener('click', () => {
        this.handleClearHandles();
        this.closeSettings();
      });
    }

    // Legacy unlink button (in setup phase)
    const unlinkBtn = this.$('unlinkRepository');
    if (unlinkBtn) {
      unlinkBtn.addEventListener('click', () => {
        this.handleUnlinkRepository();
      });
    }

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
      if (this.settingsOpen && !e.target.closest('.settings-menu') && !e.target.closest('.settings-trigger')) {
        this.closeSettings();
      }
    });

    // Form validation
    const repoInput = this.$('repositoryNameTextField');
    if (repoInput) {
      repoInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const isValid = /^[a-zA-Z0-9._-]+$/.test(value) && value.length > 0;
        
        if (value && !isValid) {
          e.target.setCustomValidity('Repository name can only contain letters, numbers, dots, hyphens, and underscores');
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
  }

  // Settings Actions
  handleUnlinkRepository() {
    if (confirm('Are you sure you want to unlink the repository? This will not delete the repository, only disconnect it from croSSync.')) {
      chrome.storage.local.remove(['github_LinkedRepository', 'userStatistics'], () => {
        this.showSuccess('Repository unlinked successfully!');
        setTimeout(() => {
          this.showPhase('link_repo_phase', 'slide-up');
        }, 2000);
      });
    }
  }

  handleClearHandles() {
    if (confirm('Are you sure you want to clear all saved platform handles?')) {
      chrome.storage.local.remove(['gfgHandle', 'leetcodeHandle'], () => {
        // Clear input fields
        const gfgInput = this.$('gfgHandle');
        const lcInput = this.$('leetcodeHandle');
        if (gfgInput) gfgInput.value = '';
        if (lcInput) lcInput.value = '';
        
        this.showSuccess('Platform handles cleared successfully!');
      });
    }
  }

  // Load saved handles
  loadSavedHandles() {
    chrome.storage.local.get(['gfgHandle', 'leetcodeHandle'], (res) => {
      const gfgInput = this.$('gfgHandle');
      const lcInput = this.$('leetcodeHandle');
      
      if (gfgInput && res?.gfgHandle) gfgInput.value = res.gfgHandle;
      if (lcInput && res?.leetcodeHandle) lcInput.value = res.leetcodeHandle;
    });
  }

  // Main initialization
  async init() {
    if (this.isInitialized) return;
    
    this.wireEvents();
    this.loadSavedHandles();
    await this.initPhases();
    
    this.isInitialized = true;
  }
}

// Initialize the popup controller
const popupController = new PopupController();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  popupController.init();
});

// Handle storage changes (for real-time updates)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.userStatistics?.newValue) {
      popupController.updateStats(changes.userStatistics.newValue);
    }
    if (changes.github_LinkedRepository?.newValue) {
      popupController.updateRepoLink(changes.github_LinkedRepository.newValue);
    }
  }
});