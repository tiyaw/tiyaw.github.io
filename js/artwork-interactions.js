// Artwork Interactions Manager
class ArtworkInteractionsManager {
  constructor() {
    // State
    this.currentImageIndex = 0;
    this.images = [];
    this.tooltip = null;
    this.modal = null;
    
    // Initialize
    this.init();
  }

  init() {
    // Get all artwork images
    this.images = Array.from(document.querySelectorAll('.masonry .column img'));
    
    // Create tooltip
    this.createTooltip();
    
    // Bind events (tooltip behavior only — modal related click behavior removed)
    this.bindEvents();
    
    // Add descriptions to images (temporary, should come from data attributes)
    this.addTemporaryDescriptions();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tw-artwork-tooltip';
    document.body.appendChild(this.tooltip);
  }

  createModal() {
    // Modal removed per request — no-op placeholder kept for compatibility
    return;
  }

  bindEvents() {
    // Hover events for tooltip
    this.images.forEach(img => {
      img.addEventListener('mouseenter', e => this.showTooltip(e));
      img.addEventListener('mousemove', e => this.moveTooltip(e));
      img.addEventListener('mouseleave', () => this.hideTooltip());
    });
    
    // No modal-related event bindings (click, keyboard nav) — only tooltip behavior remains
  }

  showTooltip(e) {
    const description = e.target.dataset.description;
    if (!description) return;
    
    this.tooltip.textContent = description;
    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    const padding = 15;
    const rect = this.tooltip.getBoundingClientRect();
    
    let x = e.clientX + padding;
    let y = e.clientY + padding;
    
    // Keep tooltip within viewport
    if (x + rect.width > window.innerWidth) {
      x = e.clientX - rect.width - padding;
    }
    if (y + rect.height > window.innerHeight) {
      y = e.clientY - rect.height - padding;
    }
    
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
  }

  showModal(e) {
    // Modal behavior removed — clicking artworks no longer opens an overlay
    return;
  }

  hideModal() {
    // Modal removed — nothing to hide
    return;
  }

  showPrevImage() {
    // removed
    return;
  }

  showNextImage() {
    // removed
    return;
  }

  updateModalImage() {
    // removed
    return;
  }

  addTemporaryDescriptions() {
    // Add sample descriptions - replace these with actual data attributes in HTML
    const descriptions = [
      'Real Time Generative art in TouchDesigner',
      'AR filter developed using Lens Studio',
      'Polgon digital portrai in Iluustrator',
      'Genrative art in TouchDesigner',
      'Motion graphics for Calvary project',
      'Creating patterns inspired from Sarkhej Roza architecture',
      'Generative motion graphics Calvary',
      'AR experience built with Adobe Aero',
      'Generative motion graphics Calvary',
      'AI-generated graphics using RunwayML',
      'Creating patterns inspired from Sarkhej Roza architecture',
      'AI-generated graphics using RunwayML',
      'Telling my childhood stories onin traditional Pattachitra art.'
    ];
    
    this.images.forEach((img, index) => {
      if (index < descriptions.length) {
        img.dataset.description = descriptions[index];
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ArtworkInteractionsManager();
});