/**
 * Plays the drawn animations in src/components/anim/ only while they are on
 * screen.
 *
 * Each one is a CSS loop. Before this runs they play from load; once it runs,
 * an animation is paused until it scrolls into view — so it starts from its
 * first frame when someone actually looks at it — and paused again when it
 * leaves, so four loops are not spending frames on nothing.
 *
 * Reduced motion needs nothing here: the CSS drops the animations and the
 * base styles are the final frame.
 */
function init() {
  const figures = document.querySelectorAll('[data-anim]');
  if (!figures.length || !('IntersectionObserver' in window)) return;

  document.documentElement.setAttribute('data-anim-ready', '');
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-playing', e.isIntersecting)),
    { threshold: 0.25 }
  );
  figures.forEach((el) => io.observe(el));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
