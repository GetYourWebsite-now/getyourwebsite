/**
 * Hosted: Allergy Rescue Kit — a real client, live on its own domain, used
 * with its owner's approval — on a phone, scrolling (a recording of
 * allergyrescuekit.com), and on a desktop beside it.
 *
 * V2.1 §7: the phone enters from depth; the desktop 300ms later from the
 * opposite rotation, so they settle facing each other slightly, like two
 * panels on a stage, and drift against each other.
 *
 * No hosting-network claim and no plan name: ARK is hosted on Railway, not
 * on our setup, and was built by hand. The caption says only what is true of
 * it: it is live on its own domain and kept current.
 */
import React from 'react';
import { COPY } from '../script.ts';
import { DemoLabel, useFormat } from '../kit.tsx';
import { CLIPS, Clip, mark } from '../footage.tsx';
import type { Box } from '../sizes.ts';
import { GlassBrowser, GlassPhone, barHeight, phoneWidthFor } from '../motion/Device3D.tsx';
import { Desktop, SITES } from './Sites.tsx';
import type { Fmt, Scene } from './types.ts';
import { FORMATS } from '../sizes.ts';

const DESK_AT = 0.3;
const CLIP = 'ark-phone-scroll';

function layout(f: Fmt) {
  const st = FORMATS[f.portrait ? 'portrait' : 'landscape'].stage;
  const { width: cw, height: ch } = CLIPS[CLIP].meta;
  const phoneH = f.portrait ? st.h : st.h - 20;
  const phoneW = phoneWidthFor(phoneH, cw, ch, f.portrait);
  const gap = f.portrait ? 18 : 70;
  const pair = f.portrait ? st.w : Math.min(st.w, 1520);
  const left = st.x + (st.w - pair) / 2;
  const phone: Box = { x: left, y: st.y + (st.h - phoneH) / 2, w: phoneW, h: phoneH };
  const deskW = pair - phoneW - gap;
  const deskH = deskW * (900 / 1440) + barHeight(f.portrait) + 1;
  const desk: Box = { x: left + phoneW + gap, y: st.y + (st.h - deskH) / 2, w: deskW, h: deskH };
  return { phone, desk };
}

export const Hosted: Scene = {
  View: ({ dur }) => {
    const { portrait, F } = useFormat();
    const { phone, desk } = layout({ W: F.W, H: F.H, portrait });
    const scrollStart = mark(CLIP, 'scroll') - 0.1;
    return (
      <>
        <GlassPhone
          box={phone}
          url={SITES.ark.url}
          enter={{ at: 0, fromRotY: 16, restRotY: 7, phase: 0 }}
          content={(w, h) => <Clip name={CLIP} box={{ x: 0, y: 0, w, h }} start={scrollStart} rate={1.3} cursor={false} />}
        />
        <GlassBrowser
          box={desk}
          url={SITES.ark.url}
          enter={{ at: DESK_AT, fromRotY: -16, restRotY: -7, phase: Math.PI }}
          content={(w, h) => <Desktop site={SITES.ark} box={{ x: 0, y: 0, w, h }} from={DESK_AT} dur={dur - DESK_AT} travel={180} />}
        />
      </>
    );
  },
  Overlay: () => <DemoLabel text={COPY.ark} />,
  sfx: () => [{ t: DESK_AT, kind: 'whoosh', gain: 0.6 }],
  whipIn: true,
};
