/**
 * Plays the drawn animations in src/components/anim/ only while they are on
 * screen.
 *
 * Each one is a CSS loop. Before this runs they play from load; once it runs,
 * an animation is paused until it scrolls into view — so it starts from its
 * first frame when someone actually looks at it — and paused again when it
 * leaves, so four loops are not spending frames on nothing.
 *
 * The merge diagram waits for the page load, and for the whole diagram to
 * be in view (or a full screen of it, if it is taller than the window),
 * before its loop starts.
 *
 * Reduced motion needs nothing here: the CSS drops the animations and the
 * base styles are the final frame.
 */
function mergeInView(entry) {
  if (!entry.isIntersecting) return false;
  const box = entry.boundingClientRect;
  if (box.height <= window.innerHeight + 2) return entry.intersectionRatio >= 0.98;
  return entry.intersectionRect.height >= window.innerHeight * 0.9;
}

function init() {
  const figures = document.querySelectorAll('[data-anim]');
  if (!figures.length || !('IntersectionObserver' in window)) return;

  document.documentElement.setAttribute('data-anim-ready', '');
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-playing', e.isIntersecting)),
    { threshold: 0.25 }
  );
  figures.forEach((el) => {
    if (!el.hasAttribute('data-merge')) io.observe(el);
  });

  const merge = document.querySelector('[data-merge]');
  const armMerge = () => {
    if (!merge) return;
    const mio = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-playing', mergeInView(e))),
      { threshold: [0, 0.5, 0.75, 0.9, 0.98, 1] }
    );
    mio.observe(merge);
  };
  if (document.readyState === 'complete') armMerge();
  else window.addEventListener('load', armMerge, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
