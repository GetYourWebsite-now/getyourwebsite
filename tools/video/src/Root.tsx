/**
 * The compositions (all 30fps, all silent in V2.1):
 *   Launch16x9      1920×1080  30.5s  the film
 *   Launch9x16      1080×1920  30.5s  the film, re-framed vertical
 *   Ad-Receipt      1080×1920  10s
 *   Ad-AllWeNeed    1080×1920  10s
 *   Ad-OneSentence  1080×1920   8s
 *   MotionTest      1920×1080         the film's hook and build only — V2.1
 *                                     §9 step 1, for judging the motion
 *
 * Remotion ids cannot contain "_": render.mjs writes Ad-Receipt out as
 * Ad_Receipt.mp4, as the brief names it.
 *
 * Before anything is drawn: the reading rule on every cut (snapped to the
 * grid) and the text floor.
 */
import React from 'react';
import { Composition } from 'remotion';
import { CUTS, FPS, assertReadingTime, compositionId, frames, type CutId } from './script.ts';
import { assertTextSize } from './sizes.ts';
import { Cut, beatsFor } from './Cut.tsx';

assertReadingTime(Object.fromEntries((Object.keys(CUTS) as CutId[]).map((c) => [c, beatsFor(c)])));
assertTextSize();

const SIZE: Record<CutId, [number, number]> = {
  Launch16x9: [1920, 1080],
  Launch9x16: [1080, 1920],
  Ad_Receipt: [1080, 1920],
  Ad_AllWeNeed: [1080, 1920],
  Ad_OneSentence: [1080, 1920],
};

const length = (cut: CutId) => beatsFor(cut).reduce((n, b) => n + frames(b.seconds), 0);
/** The film's hook and build, in frames. */
export const MOTION_TEST_FRAMES = beatsFor('Launch16x9').slice(0, 2).reduce((n, b) => n + frames(b.seconds), 0);

export const Root: React.FC = () => (
  <>
    {(Object.keys(CUTS) as CutId[]).map((cut) => (
      <Composition
        key={cut}
        id={compositionId(cut)}
        component={Cut}
        defaultProps={{ cut }}
        durationInFrames={length(cut)}
        fps={FPS}
        width={SIZE[cut][0]}
        height={SIZE[cut][1]}
      />
    ))}
    <Composition
      id="MotionTest"
      component={Cut}
      defaultProps={{ cut: 'Launch16x9' as CutId }}
      durationInFrames={MOTION_TEST_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
