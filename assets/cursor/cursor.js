/* ===================== Inverting Cursor JS ===================== */
document.addEventListener('DOMContentLoaded', () => {
    const twCursor = document.getElementById('tw-cursor');
    if (!twCursor) return;
    const twCursorInner = twCursor.querySelector('.tw-cursor__inner');
    if (!twCursorInner) return;

    const hasBackdrop =
      CSS.supports('backdrop-filter: invert(1)') ||
      CSS.supports('-webkit-backdrop-filter: invert(1)');
    if (!hasBackdrop) twCursorInner.classList.add('no-backdrop');

    window.addEventListener('pointermove', (e) => {
      twCursor.style.left = e.clientX + 'px';
      twCursor.style.top  = e.clientY + 'px';
      if (twCursor.style.display !== 'block') twCursor.style.display = 'block';
    }, { passive: true });

    document.addEventListener('mouseleave', () => { twCursor.style.display = 'none'; });
    document.addEventListener('mouseenter', () => { twCursor.style.display = 'block'; });
});