/**
 * One component per scene in docs/ads/LAUNCH-VIDEO.md §2, and the film/ad
 * runner that strings beats together.
 *
 * A beat is a scene plus its text cards (script.ts). Scenes draw; the cards
 * are laid over them here, in one place, so a headline looks the same in
 * every beat and every cut.
 */
import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { ACCENT, TOKENS, frames, type Beat } from './script.ts';
import { Fit, Headline, LowerThird, Place, Surface, ramp, useLayout, useSeconds, FONT } from './kit.tsx';
import { DRAWINGS, PHONE_BAND, phoneScreenWidth } from './sizes.ts';
import { Mark } from './drawings/Mark.tsx';
import { MergeDiagram } from './drawings/MergeDiagram.tsx';
import { ClickToChange, ClickToChangeTall, CTC_BOX, CTC_TALL_BOX } from './drawings/ClickToChange.tsx';
import { VersionTree } from './drawings/VersionTree.tsx';
import { DomainConnect, DomainConnectTall } from './drawings/DomainConnect.tsx';
import { FaceDownPhone, BENCH_BOX, IntakeForm, PhoneWithCapture } from './drawings/Props.tsx';
import landscaping from '../assets/captures/landscaping-390.jpg';

/** assets/captures/landscaping-390.jpg, in CSS px (it is stored at 2x). */
const CAPTURE: [number, number] = [390, 4862];
/** How far down the page the phone scrolls: to the end of the three service
 *  cards. The rest of the capture is there but not shown. */
const SCROLL_TO = 2900;

/* A drawing in the site's well: --bg-alt, 1px --line, the card lift. */
const Well: React.FC<{ w: number; h: number; pad?: number; children: React.ReactNode }> = ({ w, h, pad = 24, children }) => (
  <div style={{ width: w + pad * 2, height: h + pad * 2, padding: pad, background: TOKENS.bgAlt, border: `1px solid ${TOKENS.line}`, borderRadius: 8, boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(10,10,12,.04), 0 8px 24px rgba(10,10,12,.06)' }}>
    {children}
  </div>
);

/** Every scene takes the seconds into its beat. */
const SceneView: React.FC<{ beat: Beat; t: number; offset: number }> = ({ beat, t, offset }) => {
  const L = useLayout();
  switch (beat.scene) {
    case 'hook':
      return (
        <Surface tone="dark">
          <Fit w={BENCH_BOX[0]} h={BENCH_BOX[1]} box={L.portrait ? { x: 90, y: 660, w: 900, h: 820 } : { x: 560, y: 270, w: 800, h: 740 }}>
            <FaceDownPhone t={t} />
          </Fit>
        </Surface>
      );

    case 'merge':
    case 'collapse':
      return (
        <Surface tone="alt">
          <Place box={DRAWINGS.merge[L.portrait ? 'portrait' : 'landscape']}>
            <MergeDiagram t={t} portrait={L.portrait} mode={beat.scene === 'merge' ? 'build' : beat.variant === 'standalone' ? 'standalone' : 'collapse'} />
          </Place>
        </Surface>
      );

    case 'form':
      return (
        <Surface tone="alt">
          <Place box={DRAWINGS.form[L.portrait ? 'portrait' : 'landscape']}>
            <IntakeForm t={t} portrait={L.portrait} />
          </Place>
        </Surface>
      );

    case 'site': {
      const fmt = L.portrait ? 'portrait' : 'landscape';
      const screenW = phoneScreenWidth(fmt);
      const phoneH = screenW * (844 / 390) + screenW * 0.09;
      const top = PHONE_BAND[fmt].top + (PHONE_BAND[fmt].bottom - PHONE_BAND[fmt].top - phoneH) / 2;
      const p = ramp(t, 0, 0.35);
      return (
        <Surface tone="bg">
          <div style={{ position: 'absolute', left: (L.W - (screenW * 1.09)) / 2, top, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
            <PhoneWithCapture t={t} src={landscaping} capture={CAPTURE} scrollTo={SCROLL_TO} screenW={screenW} from={0.6} to={4.2} />
          </div>
        </Surface>
      );
    }

    case 'click':
    case 'person': {
      // One continuous drawing across both beats: "person" picks up where
      // "click" left off (offset), or, in a 15s cut, starts just before the
      // new version arrives.
      const local = beat.scene === 'click' ? t : t + (beat.variant === 'short' ? 3.0 : offset);
      return (
        <Surface tone="bg">
          <Place box={DRAWINGS.clickToChange[L.portrait ? 'portrait' : 'landscape']}>
            {L.portrait ? (
              <Well w={CTC_TALL_BOX[0]} h={CTC_TALL_BOX[1]} pad={16}>
                <ClickToChangeTall t={local} />
              </Well>
            ) : (
              <Well w={CTC_BOX[0]} h={CTC_BOX[1]}>
                <ClickToChange t={local} />
              </Well>
            )}
          </Place>
        </Surface>
      );
    }

    case 'tree': {
      return (
        <Surface tone="bg">
          <Place box={DRAWINGS.versionTree[L.portrait ? 'portrait' : 'landscape']}>
            <VersionTree t={t} portrait={L.portrait} mode={beat.variant === 'short' ? 'short' : 'full'} />
          </Place>
        </Surface>
      );
    }

    case 'domain':
      return (
        <Surface tone="alt">
          <Place box={DRAWINGS.domainConnect[L.portrait ? 'portrait' : 'landscape']}>
            {L.portrait ? <DomainConnectTall t={t} /> : <DomainConnect t={t} />}
          </Place>
        </Surface>
      );

    case 'offerHook':
      return (
        <Surface tone="bg">
          <div style={{ position: 'absolute', left: L.W / 2, top: L.portrait ? 1020 : 640, transform: 'translate(-50%, -50%)' }}>
            <Mark size={L.portrait ? 300 : 260} draw={Math.min(1, t / 1.1)} />
          </div>
        </Surface>
      );

    default:
      return <Surface tone="bg">{null}</Surface>;
  }
};

/* The end card and the tagline -------------------------------------------- */

const EndCard: React.FC<{ lines: string[]; from: number }> = ({ lines, from }) => {
  const t = useSeconds();
  const L = useLayout();
  const s = L.portrait ? 1.15 : 1;
  const markDraw = Math.min(1, t / 0.9);
  const word = ramp(t, 0.45, 0.35);
  const cta = lines[lines.length - 1];
  const body = lines.slice(0, -1);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center', paddingBottom: L.portrait ? 160 : 0 }}>
      <Mark size={140 * s} draw={markDraw} />
      <div style={{ marginTop: 22 * s, fontSize: 40 * s, fontWeight: 600, letterSpacing: '-0.02em', color: TOKENS.ink, opacity: word }}>GetYourWebsite</div>
      <div style={{ height: 56 * s }} />
      {body.map((line, i) => {
        const p = ramp(t, from + i * 0.15, 0.3);
        const first = i === 0 && body.length > 1;
        return (
          <div key={i} style={{ maxWidth: L.portrait ? 900 : 1300, fontSize: (first ? 40 : 58) * s, fontWeight: first ? 500 : 600, letterSpacing: first ? 'normal' : '-0.025em', lineHeight: 1.15, color: first ? ACCENT : TOKENS.ink, marginBottom: 18 * s, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, textWrap: 'balance' }}>
            {line}
          </div>
        );
      })}
      {(() => {
        const p = ramp(t, from + body.length * 0.15, 0.3);
        return (
          <div style={{ marginTop: 30 * s, padding: `${22 * s}px ${36 * s}px`, borderRadius: 6, background: ACCENT, color: '#fff', fontSize: 36 * s, fontWeight: 550, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, maxWidth: L.portrait ? 940 : 'none' }}>
            {cta}
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

const Centered: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const t = useSeconds();
  const L = useLayout();
  const p = ramp(t, from, 0.3);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ fontSize: L.portrait ? 96 : 92, fontWeight: 600, letterSpacing: '-0.03em', color: TOKENS.ink, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, textAlign: 'center', maxWidth: L.portrait ? 900 : 1500 }}>{text}</div>
    </AbsoluteFill>
  );
};

/* One beat: the scene, then its text cards on top ------------------------- */

const BeatView: React.FC<{ beat: Beat; offset: number }> = ({ beat, offset }) => {
  const t = useSeconds();
  const dark = beat.scene === 'hook';
  return (
    <AbsoluteFill>
      <SceneView beat={beat} t={t} offset={offset} />
      {beat.cues.map((c, i) => {
        if (c.kind === 'lowerThird') return <LowerThird key={i} text={c.text} from={c.from} />;
        if (c.kind === 'endCard') return <EndCard key={i} lines={c.lines ?? [c.text]} from={c.from} />;
        if (beat.scene === 'tagline') return <Centered key={i} text={c.text} from={c.from} />;
        return <Headline key={i} text={c.text} from={c.from} color={dark ? '#ffffff' : TOKENS.ink} />;
      })}
    </AbsoluteFill>
  );
};

/** A cut: its beats back to back. `offset` is how long the previous beat
 *  ran, so the click/person drawing can run as one continuous timeline. */
export const Cut: React.FC<{ beats: Beat[] }> = ({ beats }) => (
  <AbsoluteFill style={{ background: TOKENS.bg, fontFamily: FONT }}>
    <Series>
      {beats.map((b, i) => (
        <Series.Sequence key={i} durationInFrames={frames(b.seconds)}>
          <BeatView beat={b} offset={i > 0 ? beats[i - 1].seconds : 0} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
