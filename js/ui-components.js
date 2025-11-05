// UI Components Manager
class UIComponentsManager {
  constructor() {
    this.snackbar = null;
    this.infoIcon = null;
    this.scrollArrow = null;
    this.lastScrollY = window.scrollY;
    // Layout constants for icon stacking on the right
    this.iconTopOffset = 20; // px from top
    this.iconSize = 40; // px (matches CSS)
    this.iconSpacing = 8; // px gap between icons
    this.init();
  }

  init() {
    this.createSnackbar();
    this.createInfoIcon();
    this.createScrollArrow();
    this.bindEvents();
    this.showInitialSnackbar();
  }

  createSnackbar() {
    this.snackbar = document.createElement('div');
    this.snackbar.className = 'tw-snackbar';
    this.snackbar.textContent = 'collect words and click on them to briefly know about me or scroll';
    document.body.appendChild(this.snackbar);
  }

  createInfoIcon() {
    this.infoIcon = document.createElement('div');
    this.infoIcon.className = 'tw-info-icon';
    // ensure it's on the right (CSS already sets this, but keep a fallback)
    this.infoIcon.style.right = '20px';
    this.infoIcon.style.top = `${this.iconTopOffset}px`;
    document.body.appendChild(this.infoIcon);
  }

  createScrollArrow() {
    this.scrollArrow = document.createElement('div');
    this.scrollArrow.className = 'tw-scroll-arrow';
    // fallback right alignment
    this.scrollArrow.style.right = '20px';
    document.body.appendChild(this.scrollArrow);
  }

  bindEvents() {
    // Info icon click handler
    this.infoIcon.addEventListener('click', () => this.showSnackbarTemporarily());

    // Scroll arrow click handler
    this.scrollArrow.addEventListener('click', () => this.handleScrollArrowClick());

    // Scroll event handler with throttle
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  showInitialSnackbar() {
    // Show snackbar
    setTimeout(() => {
      this.snackbar.classList.add('visible');
    }, 100);

    // Hide snackbar and show info icon after 5 seconds
    setTimeout(() => {
      this.snackbar.classList.remove('visible');
      setTimeout(() => {
        this.infoIcon.classList.add('visible');
      }, 300);
    }, 5000);

    // Show scroll arrow
    setTimeout(() => {
      // position arrow directly below info icon on initial show
      const topPos = this.iconTopOffset + this.iconSize + this.iconSpacing;
      this.scrollArrow.style.top = `${topPos}px`;
      this.scrollArrow.style.bottom = '';
      this.updateScrollArrowVisibility(true);
    }, 1000);
  }

  showSnackbarTemporarily() {
    this.infoIcon.classList.remove('visible');
    this.snackbar.classList.add('visible');

    setTimeout(() => {
      this.snackbar.classList.remove('visible');
      setTimeout(() => {
        this.infoIcon.classList.add('visible');
      }, 300);
    }, 3000);
  }

  handleScroll() {
    const currentScroll = window.scrollY;
    const scrollingUp = currentScroll < this.lastScrollY;
    const atTop = currentScroll <= 0;
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const clientHeight = document.documentElement.clientHeight;
    const atBottom = currentScroll + clientHeight >= scrollHeight - 50;

    // Show info icon ONLY when at the very top (landing page). Do NOT show when at bottom
    if (atTop) {
      this.infoIcon.classList.add('visible');
    } else {
      this.infoIcon.classList.remove('visible');
    }

    // Update scroll arrow
    this.updateScrollArrow(currentScroll, atTop, atBottom);

    this.lastScrollY = currentScroll;
  }

  updateScrollArrow(currentScroll, atTop, atBottom) {
    // Position: when at (near) top, place arrow directly below info icon; otherwise pin to bottom-right
    const arrowAtTop = currentScroll <= 100;
    if (arrowAtTop) {
      const topPos = this.iconTopOffset + this.iconSize + this.iconSpacing;
      this.scrollArrow.style.top = `${topPos}px`;
      this.scrollArrow.style.bottom = '';
    } else {
      this.scrollArrow.style.top = '';
      this.scrollArrow.style.bottom = '20px';
    }

    // Direction
    if (atTop) {
      this.scrollArrow.classList.remove('up');
    } else {
      this.scrollArrow.classList.add('up');
    }

    // Visibility: ensure arrow remains visible at bottom as well
    this.updateScrollArrowVisibility(true);
  }

  updateScrollArrowVisibility(show) {
    if (show) {
      this.scrollArrow.classList.add('visible');
    } else {
      this.scrollArrow.classList.remove('visible');
    }
  }

  handleScrollArrowClick() {
    const currentScroll = window.scrollY;
    const atTop = currentScroll <= 0;

    if (atTop) {
      // Scroll down to the bottom-most area so footer is visible.
      const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const clientHeight = document.documentElement.clientHeight;
      let target = Math.max(0, docHeight - clientHeight);

      // If a footer element exists, compute a target that brings the footer into view
      const footer = document.querySelector('.footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const footerTopAbs = footerRect.top + window.scrollY;
        // Try to position so the entire footer is visible if it fits, otherwise show its top
        const footerHeight = footer.offsetHeight || 0;
        if (footerHeight < clientHeight) {
          target = Math.max(0, footerTopAbs - (clientHeight - footerHeight));
        } else {
          // footer taller than viewport: just bring its top into view
          target = Math.max(0, footerTopAbs);
        }
        // clamp
        target = Math.min(target, docHeight - clientHeight);
      }

      const distance = Math.abs(target - currentScroll);
      // duration proportional to distance with sensible clamps for human feel
      const duration = Math.min(1800, Math.max(700, Math.round((distance / clientHeight) * 900 + 300)));
      this.smoothScrollTo(target, duration);
    } else {
      // Scroll to top smoothly with duration based on distance for gentler feel
      const distance = Math.abs(currentScroll - 0);
      const clientHeight = document.documentElement.clientHeight;
      const duration = Math.min(1400, Math.max(600, Math.round((distance / clientHeight) * 900 + 200)));
      this.smoothScrollTo(0, duration);
    }
  }

  // Smooth scroll helper using requestAnimationFrame with an ease function
  smoothScrollTo(target, duration = 700) {
    const start = window.scrollY || window.pageYOffset;
    const change = target - start;
    const startTime = performance.now();

    // smoother "human" easing: easeInOutCubic (nice natural acceleration)
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);
      // subpixel-friendly
      window.scrollTo(0, start + change * eased);
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// Initialize UI components after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UIComponentsManager();
});