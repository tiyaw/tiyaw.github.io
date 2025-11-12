// Simple vanilla JS tag-based filter for project cards
document.addEventListener('DOMContentLoaded', function () {
  const tabs = Array.from(document.querySelectorAll('.project-tab-container .tab'));
  const cards = Array.from(document.querySelectorAll('.card-container .card'));
  const TRANSITION_MS = 350;

  function setActiveTab(clicked) {
    tabs.forEach(t => t.classList.toggle('active', t === clicked));
  }

  function showCard(card) {
    // If already visible, do nothing
    if (!card.classList.contains('is-hidden')) return;
    card.style.display = ''; // restore
    // force reflow so transition can run
    // eslint-disable-next-line no-unused-expressions
    card.offsetHeight;
    card.classList.remove('is-hidden');
  }

  function hideCard(card) {
    if (card.classList.contains('is-hidden')) return;
    card.classList.add('is-hidden');
    // after transition, set display none to remove from flow
    setTimeout(() => {
      // If still hidden (might have been shown again), then hide fully
      if (card.classList.contains('is-hidden')) card.style.display = 'none';
    }, TRANSITION_MS + 20);
  }

  function filterBy(category) {
    if (category === 'all') {
      cards.forEach(showCard);
      return;
    }
    cards.forEach(card => {
      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      if (cat === category) showCard(card);
      else hideCard(card);
    });
  }

  // attach events
  tabs.forEach(tab => {
    tab.addEventListener('click', function (e) {
      const cat = tab.getAttribute('data-filter');
      setActiveTab(tab);
      filterBy(cat);
    });
  });

  // initial state: All (already active in markup), ensure all visible
  filterBy('all');
});
