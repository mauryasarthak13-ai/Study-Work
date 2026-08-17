// ui-enhancements.js
// Small runtime helpers: respect prefers-reduced-motion and setup FAB placement

(function () {
  // Add reduced-motion class if user prefers reduced motion
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function applyReduced(e) {
      if (e.matches) document.documentElement.classList.add('reduced-motion');
      else document.documentElement.classList.remove('reduced-motion');
    }
    applyReduced(mq);
    mq.addEventListener ? mq.addEventListener('change', applyReduced) : mq.addListener(applyReduced);
  } catch (e) {}

  // Helper: inject FAB container if missing (so React can render into it)
  if (!document.getElementById('fab-root')) {
    const el = document.createElement('div');
    el.id = 'fab-root';
    el.style.position = 'fixed';
    el.style.zIndex = '60';
    el.style.right = '18px';
    el.style.bottom = '18px';
    document.body.appendChild(el);
  }
})();
