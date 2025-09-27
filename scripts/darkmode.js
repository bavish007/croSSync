// ===== croSSync - Enhanced Theme Management =====

class ThemeManager {
  constructor() {
    this.THEME_KEY = 'croSSyncTheme';
    this.currentTheme = 'dark';
    this.isInitialized = false;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
  }

  // Apply theme with smooth transition
  applyTheme(theme, animate = true) {
    if (animate) {
      // Add transition class for smooth theme switching
      document.documentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    
    // Save to storage
    chrome.storage.local.set({ [this.THEME_KEY]: theme });
    
    // Update toggle state
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.checked = theme === 'light';
    }

    // Remove transition after animation completes
    if (animate) {
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 300);
    }

    // Emit custom event for other components
    document.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, previousTheme: this.currentTheme } 
    }));
  }

  // Toggle between light and dark themes
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme, true);
  }

  // Detect system theme preference
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  // Initialize theme system
  init() {
    if (this.isInitialized) return;

    // Load saved theme or use system preference
    chrome.storage.local.get(this.THEME_KEY, (res) => {
      let theme = res?.[this.THEME_KEY];
      
      // If no saved theme, use system preference
      if (!theme) {
        theme = this.getSystemTheme();
      }
      
      this.applyTheme(theme, false);
      this.setupEventListeners();
      this.isInitialized = true;
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Theme toggle button
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        this.toggleTheme();
      });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a theme
        chrome.storage.local.get(this.THEME_KEY, (res) => {
          if (!res?.[this.THEME_KEY]) {
            const systemTheme = e.matches ? 'light' : 'dark';
            this.applyTheme(systemTheme, true);
          }
        });
      });
    }

    // Keyboard shortcut (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Check if dark theme is active
  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  // Reset to system theme
  resetToSystemTheme() {
    chrome.storage.local.remove(this.THEME_KEY, () => {
      const systemTheme = this.getSystemTheme();
      this.applyTheme(systemTheme, true);
    });
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
  });
} else {
  themeManager.init();
}

// Make theme manager globally available
window.themeManager = themeManager;