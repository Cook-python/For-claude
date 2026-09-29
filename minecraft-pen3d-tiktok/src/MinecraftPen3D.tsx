import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import clips from './clips.json';

const dela = 'Dela Gothic One';
const dot = 'DotGothic16';
loadFont({family: dela, url: staticFile('fonts/DelaGothicOne.ttf')});
loadFont({family: dot, url: staticFile('fonts/DotGothic16.ttf')});

type ClipName = keyof typeof clips;

const PANEL_W = 1080;
const PANEL_H = 810;
const PANEL_TOP = 560;

const POPS = [13, 21, 38, 51, 64, 77, 90, 103, 116, 129];
const BLOCK_COLORS = ['#7a7a7a', '#8b5a2b', '#e8d9a0', '#5fae3a', '#ffcc33', '#b0764a'];

const frameSrc = (clip: ClipName | 'title', frame: number, dur: number) => {
  if (clip === 'title') return staticFile('title.jpg');
  const count = clips[clip];
  const i = Math.min(count - 1, Math.max(0, Math.floor((frame * count) / dur)));
  return staticFile(`${clip}/${String(i).padStart(4, '0')}.jpg`);
};

const beatPulse = (frame: number) => {
  const p = (frame % 15) / 15;
  return 1 + 0.012 * Math.exp(-p * 6);
};

const GameShot: React.FC<{
  clip: ClipName | 'title';
  dur: number;
  zoomFrom?: number;
  zoomTo?: number;
  bump?: number[];
}> = ({clip, dur, zoomFrom = 1, zoomTo = 1.06, bump = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const src = frameSrc(clip, frame, dur);
  const zoom = interpolate(frame, [0, dur], [zoomFrom, zoomTo], {extrapolateRight: 'clamp'});
  const kick = bump.reduce((acc, b) => {
    if (frame < b) return acc;
    const s = spring({frame: frame - b, fps, config: {damping: 9, stiffness: 260}, durationInFrames: 10});
    return acc + 0.035 * (1 - s);
  }, 0);
  const enter = spring({frame, fps, config: {damping: 14, stiffness: 180}});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={src}
          style={{
            position: 'absolute',
            width: 2560,
            height: 1920,
            left: (1080 - 2560) / 2,
            top: 0,
            filter: 'blur(38px) brightness(0.45) saturate(1.3)',
            transform: 'scale(1.1)',
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: PANEL_TOP,
          left: 0,
          width: PANEL_W,
          height: PANEL_H,
          overflow: 'hidden',
          transform: `scale(${(0.92 + 0.08 * enter) * beatPulse(frame) + kick})`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          borderTop: '6px solid #1d1d1d',
          borderBottom: '6px solid #1d1d1d',
        }}
      >
        <Img src={src} style={{width: PANEL_W, height: PANEL_H, transform: `scale(${zoom})`}} />
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{
  small?: string;
  big: string;
  color?: string;
  top?: number;
  bigSize?: number;
}> = ({small, big, color = '#ffe14d', top = 210, bigSize = 132}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s1 = spring({frame, fps, config: {damping: 11, stiffness: 220}});
  const s2 = spring({frame: frame - 4, fps, config: {damping: 9, stiffness: 240}});
  const stroke = (w: number) =>
    `${w}px ${w}px 0 #000, -${w}px ${w}px 0 #000, ${w}px -${w}px 0 #000, -${w}px -${w}px 0 #000, 0 ${w + 8}px 0 rgba(0,0,0,0.55)`;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontFamily: dela,
        lineHeight: 1.12,
      }}
    >
      {small ? (
        <div
          style={{
            fontSize: 70,
            color: '#fff',
            textShadow: stroke(5),
            transform: `translateY(${(1 - s1) * -40}px)`,
            opacity: s1,
          }}
        >
          {small}
        </div>
      ) : null}
      <div
        style={{
          fontSize: bigSize,
          color,
          textShadow: stroke(7),
          transform: `scale(${0.4 + 0.6 * s2}) rotate(${(1 - s2) * -6}deg)`,
          opacity: Math.min(1, s2 * 2),
          whiteSpace: 'nowrap',
        }}
      >
        {big}
      </div>
    </div>
  );
};

const SubLabel: React.FC<{text: string; delay?: number}> = ({text, delay = 6}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 200}});
  return (
    <div
      style={{
        position: 'absolute',
        top: PANEL_TOP + PANEL_H + 70,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: s,
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          fontFamily: dot,
          fontSize: 54,
          color: '#fff',
          background: 'rgba(0,0,0,0.72)',
          border: '5px solid #fff',
          padding: '14px 34px',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Burst: React.FC<{at: number; seed: number}> = ({at, seed}) => {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > 16) return null;
  const pieces = Array.from({length: 10}, (_, i) => {
    const a = ((i + seed * 0.37) / 10) * Math.PI * 2;
    const d = interpolate(frame, [0, 16], [20, 260], {easing: Easing.out(Easing.cubic)});
    const size = interpolate(frame, [0, 16], [34, 6]);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 540 + Math.cos(a) * d - size / 2,
          top: PANEL_TOP + PANEL_H / 2 + Math.sin(a) * d + frame * frame * 0.6 - size / 2,
          width: size,
          height: size,
          background: BLOCK_COLORS[(i + seed) % BLOCK_COLORS.length],
          border: '3px solid rgba(0,0,0,0.5)',
        }}
      />
    );
  });
  return <AbsoluteFill>{pieces}</AbsoluteFill>;
};

const Flash: React.FC<{at: number; strength?: number}> = ({at, strength = 0.9}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 8], [strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at) return null;
  return <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};

const Badge: React.FC<{text: string; delay: number; color: string}> = ({text, delay, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 10, stiffness: 230}});
  return (
    <div
      style={{
        fontFamily: dela,
        fontSize: 58,
        color: '#fff',
        background: color,
        border: '6px solid #000',
        boxShadow: '0 10px 0 #000',
        padding: '16px 34px',
        transform: `scale(${s})`,
        opacity: Math.min(1, s * 2),
      }}
    >
      {text}
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({frame, fps, config: {damping: 9, stiffness: 160}});
  const cta = spring({frame: frame - 34, fps, config: {damping: 10, stiffness: 200}});
  const pulse = 1 + 0.05 * Math.sin((frame / 15) * Math.PI * 2);
  const last = staticFile(`pan/${String(clips.pan - 1).padStart(4, '0')}.jpg`);
  return (
    <AbsoluteFill>
      <Img
        src={last}
        style={{
          position: 'absolute',
          width: 2560,
          height: 1920,
          left: (1080 - 2560) / 2,
          filter: 'blur(20px) brightness(0.5)',
          transform: `scale(${1.1 + frame * 0.001})`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 75%)'}} />
      <div style={{position: 'absolute', top: 290, width: '100%', textAlign: 'center'}}>
        <div
          style={{
            fontFamily: dot,
            fontSize: 60,
            color: '#fff',
            letterSpacing: 6,
            opacity: logo,
            textShadow: '4px 4px 0 #000',
          }}
        >
          Scratchで遊べる
        </div>
        <div
          style={{
            fontFamily: dela,
            fontSize: 150,
            color: '#fff',
            transform: `scale(${logo}) rotate(${(1 - logo) * 8}deg)`,
            textShadow: '8px 8px 0 #3a3a3a, 14px 14px 0 #000',
            letterSpacing: 4,
            marginTop: 10,
          }}
        >
          Minecraft
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 26,
            fontFamily: dela,
            fontSize: 72,
            color: '#1a1a1a',
            background: '#ffe14d',
            padding: '8px 36px',
            border: '6px solid #000',
            transform: `scale(${logo}) rotate(-3deg)`,
          }}
        >
          PEN 3D
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 860,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 34,
        }}
      >
        <Badge text="マルチプレイ対応" delay={10} color="#3c8d2f" />
        <Badge text="4か国語対応" delay={16} color="#2f6fb5" />
        <Badge text="コード12,779ブロック" delay={22} color="#b5462f" />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1420,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${cta * pulse})`,
          opacity: Math.min(1, cta * 2),
        }}
      >
        <div
          style={{
            fontFamily: dela,
            fontSize: 76,
            color: '#000',
            background: 'linear-gradient(#ffe86b, #ffb800)',
            border: '7px solid #000',
            borderRadius: 24,
            padding: '24px 56px',
            boxShadow: '0 14px 0 #000',
          }}
        >
          ▶ 今すぐ遊んでみて！
        </div>
      </div>
      <Flash at={0} strength={1} />
    </AbsoluteFill>
  );
};

export const MinecraftPen3D: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('bgm.wav')} />
      <Sequence from={0} durationInFrames={60}>
        <GameShot clip="hook" dur={60} zoomFrom={1.08} zoomTo={1} />
        <Caption small="え、これ全部…" big="Scratch製!?" />
        <SubLabel text="3Dのマイクラが動いてる" delay={14} />
      </Sequence>
      <Sequence from={60} durationInFrames={30}>
        <GameShot clip="title" dur={30} zoomFrom={1} zoomTo={1.12} />
        <Caption small="ペン機能だけで" big="3D描画" color="#7df0ff" />
        <Flash at={0} strength={0.7} />
      </Sequence>
      <Sequence from={90} durationInFrames={60}>
        <GameShot clip="gen" dur={60} zoomFrom={1} zoomTo={1.05} />
        <Caption small="地形は毎回" big="ランダム生成" />
        <SubLabel text="山・谷・木まで自動で作る" delay={8} />
      </Sequence>
      <Sequence from={150} durationInFrames={135}>
        <GameShot clip="build" dur={138} zoomFrom={1.02} zoomTo={1.02} bump={POPS} />
        {POPS.map((p, i) => (
          <Burst key={p} at={p} seed={i} />
        ))}
        <Sequence durationInFrames={62}>
          <Caption small="掘る！置く！" big="建てる！" color="#8dff6b" />
        </Sequence>
        <Sequence from={62}>
          <Caption small="作業台も松明も" big="全部置ける" color="#ffb347" />
        </Sequence>
        <SubLabel text="3つのゲームモード搭載" delay={10} />
        <Flash at={0} strength={0.8} />
      </Sequence>
      <Sequence from={285} durationInFrames={75}>
        <GameShot clip="pan" dur={78} zoomFrom={1} zoomTo={1.1} />
        <Caption small="どこまでも広がる" big="3Dワールド" color="#7df0ff" />
        <SubLabel text="歩いて・跳んで・飛べる" delay={10} />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
