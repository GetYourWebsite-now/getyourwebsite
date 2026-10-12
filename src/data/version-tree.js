/**
 * The hero version tree's geometry, in one place.
 *
 * Shared by src/components/VersionTree.astro (which draws it on the page)
 * and tools/og.mjs (which draws the same tree into the social card). A
 * second copy of these labels and coordinates is a second thing to forget
 * to update, and the social image is the one surface nobody looks at after
 * it ships.
 */
/** Node geometry for the wide (left-to-right) layout. viewBox 636 x 244.
 *
 *  Sized so the tree fills its frame rather than floating in it: the content
 *  occupies 95% of the box's height, against 81% in the first version, and
 *  the labels render around 15px at 1440 instead of 12.5px. */
export const WIDE = {
  w: 136,
  h: 64,
  nodes: [
    { label: 'First build', x: 7, y: 90 },
    { label: 'Warmer photos', x: 169, y: 90 },
    { label: 'Online orders', x: 331, y: 90, live: true },
    { label: 'Christmas', x: 493, y: 6, target: true },
    { label: 'Spring menu', x: 493, y: 174 },
  ],
  edges: [
    'M143,122 L169,122',
    'M305,122 L331,122',
    'M467,122 C481,122 479,38 493,38',
    'M467,122 C481,122 479,206 493,206',
  ],
};

/** Node geometry for the narrow (top-to-bottom) layout. viewBox 356 x 356. */
export const NARROW = {
  w: 176,
  h: 62,
  branchW: 162,
  nodes: [
    { label: 'First build', x: 90, y: 6 },
    { label: 'Warmer photos', x: 90, y: 94 },
    { label: 'Online orders', x: 90, y: 182, live: true },
    { label: 'Christmas', x: 5, y: 286, w: 162, target: true },
    { label: 'Spring menu', x: 189, y: 286, w: 162 },
  ],
  edges: [
    'M178,68 L178,94',
    'M178,156 L178,182',
    'M178,244 C178,272 86,266 86,286',
    'M178,244 C178,272 270,266 270,286',
  ],
};
