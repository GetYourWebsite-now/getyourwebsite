import type React from 'react';
import type { Beat } from '../script.ts';
import type { Camera } from '../motion/Stage.tsx';
import type { RuleAt } from '../motion/Type.tsx';

export type SfxKind = 'click' | 'key' | 'whoosh' | 'pop' | 'rip' | 'printer';
/** A sound at `t` seconds into the beat. (V2.1 is silent; kept for later.) */
export type Sfx = { t: number; kind: SfxKind; gain?: number };

export type Fmt = { W: number; H: number; portrait: boolean };
export type SceneProps = { beat: Beat; dur: number };
export type Scene = {
  View: React.FC<SceneProps>;
  /** Drawn in front, not under the camera (lower thirds). */
  Overlay?: React.FC<SceneProps>;
  /** The beat's sounds, in beat time. */
  sfx: (beat: Beat, dur: number) => Sfx[];
  /** Fictional data on screen, labelled (§0). */
  label?: 'Demo account' | 'Demo business';
  /** The camera at `t` seconds into the beat (default: the push-in). */
  camera?: (t: number, dur: number, f: Fmt) => Camera;
  /** Where the indigo rule sits, if not under the caption — at any time
   *  (it may move, e.g. growing with the hook's words). It is asked for a
   *  new target at the beat's start and at each cue's start less `ruleLead`. */
  rule?: (t: number, beat: Beat, dur: number, f: Fmt) => RuleAt | null;
  /** Seconds before a cue that the rule starts for it (default RULE_LEAD). */
  ruleLead?: number;
  /** The beat enters on a whip pan (V2.1 §3). */
  whipIn?: boolean;
};
