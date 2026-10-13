/**
 * The five compositions the brief asks for, all 30fps:
 *   Launch16x9   1920×1080  52s   the film
 *   Launch9x16   1080×1920  52s   the film, vertical
 *   Ad9x16_V1    1080×1920  15s   pain → product
 *   Ad9x16_V2    1080×1920  15s   positioning
 *   Ad9x16_V3    1080×1920  15s   offer-forward
 *
 * Remotion composition ids cannot contain "_", so the ads are registered as
 * Ad9x16-V1 etc.; render.mjs writes them out under the brief's names
 * (Ad9x16_V1.mp4).
 *
 * The reading-time rule runs first: a card that is too short stops the
 * studio and every render here, before a frame is drawn.
 */
import React from 'react';
import { Composition } from 'remotion';
import { Cut } from './Scenes.tsx';
import { CUTS, FPS, assertReadingTime, beatFrames, compositionId } from './script.ts';
import { assertTextSize } from './sizes.ts';

assertReadingTime();
assertTextSize();

const SIZES: Record<keyof typeof CUTS, [number, number]> = {
  Launch16x9: [1920, 1080],
  Launch9x16: [1080, 1920],
  Ad9x16_V1: [1080, 1920],
  Ad9x16_V2: [1080, 1920],
  Ad9x16_V3: [1080, 1920],
};

export const Root: React.FC = () => (
  <>
    {(Object.keys(CUTS) as (keyof typeof CUTS)[]).map((id) => (
      <Composition
        key={id}
        id={compositionId(id)}
        component={Cut}
        defaultProps={{ beats: CUTS[id] }}
        durationInFrames={beatFrames(CUTS[id])}
        fps={FPS}
        width={SIZES[id][0]}
        height={SIZES[id][1]}
      />
    ))}
  </>
);
