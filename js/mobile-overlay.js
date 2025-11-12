// Mobile Overlay Manager
class MobileOverlayManager {
  constructor() {
    // Configuration
    this.breakpoint = 1024; // Show overlay below this width
    this.overlayId = 'tw-mobile-overlay';
    
    // State
    this.overlay = null;
    this.mediaQuery = window.matchMedia(`(min-width: ${this.breakpoint}px)`);
    
    // Bind methods to preserve context
    this.handleViewportChange = this.handleViewportChange.bind(this);
    
    // Initialize
    this.init();
  }

  init() {
    // Create overlay if it doesn't exist
    if (!document.getElementById(this.overlayId)) {
      this.createOverlay();
    }
    
    // Set up viewport change listener
    this.mediaQuery.addListener(this.handleViewportChange);
    
    // Check initial viewport size
    this.handleViewportChange(this.mediaQuery);
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = this.overlayId;
    this.overlay.className = 'tw-mobile-overlay';
    
    const message = document.createElement('div');
    message.className = 'tw-mobile-overlay__message';
    message.textContent = 'For the best experience, please view this website on a desktop device.';
    
    this.overlay.appendChild(message);
    document.body.appendChild(this.overlay);
  }

  handleViewportChange(e) {
    if (!this.overlay) {
      this.overlay = document.getElementById(this.overlayId);
      if (!this.overlay) return;
    }

    // Show overlay when viewport is narrow, hide when wide
    if (e.matches) {
      // Viewport >= breakpoint
      this.overlay.classList.remove('visible');
    } else {
      // Viewport < breakpoint
      this.overlay.classList.add('visible');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MobileOverlayManager();
});