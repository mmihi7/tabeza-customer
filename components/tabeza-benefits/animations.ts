// Tabeza customer-benefit Lottie animations.
//
// Hand-authored Bodymovin JSON (v5.7) — pure vector primitives (rects, ellipses,
// stars, strokes) on a 200×200 artboard, transparent background. Each scene loops
// and encodes ONE benefit of Tabeza from a customer's point of view.
//
// Palette mirrors the customer app brand:
//   orange #FF4F00  -> [1, 0.31, 0,    1]
//   amber  #FFA83A  -> [1, 0.66, 0.23, 1]
//   cream  #FFEDD6  -> [1, 0.93, 0.84, 1]

export interface LottieSceneData {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm: string;
  ddd: number;
  assets: unknown[];
  layers: unknown[];
  markers: unknown[];
}

const EASE_OUT = { x: [0.42], y: [0] };
const EASE_IN = { x: [0.58], y: [1] };
const POP_IN = { x: [0.19], y: [1] };
const SNAP = { x: [0.22], y: [1] };

// ── 1. Open a tab in seconds (phone + check) ────────────────────────────────
// A softly breathing phone outline; a check strokes in from the centre.
const openTabLottie: LottieSceneData = {
  v: '5.7.4', fr: 30, ip: 0, op: 90, w: 200, h: 200, nm: 'open-tab', ddd: 0, assets: [], markers: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'phone', sr: 1, ip: 0, op: 90, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [100, 100, 100], e: [103, 103, 100], i: EASE_OUT, o: EASE_IN },
          { t: 45, s: [103, 103, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
        ] },
      },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'phone-g', bm: 0,
        it: [
          { ty: 'rc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [92, 152] }, r: { a: 0, k: 24 } },
          { ty: 'st', c: { a: 0, k: [1, 0.93, 0.84, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 8 }, lc: 2, lj: 2 },
          { ty: 'rc', p: { a: 0, k: [0, -16] }, s: { a: 0, k: [62, 110] }, r: { a: 0, k: 12 } },
          { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 22 } },
          { ty: 'el', p: { a: 0, k: [0, -58] }, s: { a: 0, k: [10, 10] } },
          { ty: 'fl', c: { a: 0, k: [1, 0.93, 0.84, 1] }, o: { a: 0, k: 70 } },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: 'check', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 104, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'check-g', bm: 0,
        it: [
          { ty: 'sh', ks: { a: 0, k: { c: false, i: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], o: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v: [[-28, 4, 0], [0, 30, 0], [30, -22, 0]] } } },
          { ty: 'st', c: { a: 0, k: [1, 0.66, 0.23, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 12 }, lc: 2, lj: 2 },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 1, k: [
            { t: 0, s: [0, 0, 100], e: [114, 114, 100], i: POP_IN, o: SNAP },
            { t: 10, s: [114, 114, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
          ] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
  ],
};

// ── 2. Pay from your seat (card + coin drop) ────────────────────────────────
// A payment card rocks gently; a coin drops in and squashes on impact.
const payLottie: LottieSceneData = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'pay', ddd: 0, assets: [], markers: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'card', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 1, k: [
          { t: 0, s: [-2], e: [2], i: EASE_OUT, o: EASE_IN },
          { t: 30, s: [2], e: [-2], i: EASE_OUT, o: EASE_IN },
          { t: 60, s: [-2], e: [2], i: EASE_OUT, o: EASE_IN },
        ] }, p: { a: 0, k: [100, 104, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'card-g', bm: 0,
        it: [
          { ty: 'rc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [148, 94] }, r: { a: 0, k: 16 } },
          { ty: 'fl', c: { a: 0, k: [1, 0.93, 0.84, 1] }, o: { a: 0, k: 10 } },
          { ty: 'st', c: { a: 0, k: [1, 0.66, 0.23, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 6 }, lc: 2, lj: 2 },
          { ty: 'rc', p: { a: 0, k: [-46, 16] }, s: { a: 0, k: [26, 20] }, r: { a: 0, k: 6 } },
          { ty: 'fl', c: { a: 0, k: [1, 0.66, 0.23, 1] }, o: { a: 0, k: 100 } },
          { ty: 'rc', p: { a: 0, k: [12, 18] }, s: { a: 0, k: [78, 10] }, r: { a: 0, k: 5 } },
          { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 80 } },
          { ty: 'rc', p: { a: 0, k: [12, 34] }, s: { a: 0, k: [54, 10] }, r: { a: 0, k: 5 } },
          { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 50 } },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: 'coin', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [0, 0, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [100, 100, 100], e: [118, 80, 100], i: EASE_OUT, o: EASE_IN },
          { t: 20, s: [118, 80, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
        ] },
      },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'coin-g', bm: 0,
        it: [
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [54, 54] } },
          { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 100 } },
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [20, 20] } },
          { ty: 'fl', c: { a: 0, k: [1, 0.93, 0.84, 1] }, o: { a: 0, k: 90 } },
          { ty: 'tr', p: { a: 1, k: [
            { t: 0, s: [0, -96], e: [0, 0], i: EASE_OUT, o: EASE_IN },
            { t: 18, s: [0, 0], e: [0, -10], i: EASE_OUT, o: EASE_IN },
            { t: 24, s: [0, -10], e: [0, 0], i: EASE_OUT, o: EASE_IN },
          ] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
  ],
};

// ── 3. Your tab, live (equaliser bars + pulse dot) ──────────────────────────
// Three bars climb like a live signal; a dot blinks above, meaning "live".
const bar = (name: string, ind: number, x: number, h: number, color: number[], opacity: number, start: number) => ({
  ddd: 0, ind, ty: 4, nm: name, sr: 1, ip: 0, op: 90, st: 0, bm: 0,
  ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [x, 46, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
  ao: 0,
  shapes: [{
    ty: 'gr', nm: `${name}-g`, bm: 0,
    it: [
      { ty: 'rc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [26, h] }, r: { a: 0, k: 13 } },
      { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: opacity } },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 1, k: [
        { t: start, s: [100, 0, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
        { t: start + 14, s: [100, 100, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
      ] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ],
  }],
});

const blinkDot = {
  ddd: 0, ind: 5, ty: 4, nm: 'live-dot', sr: 1, ip: 0, op: 90, st: 0, bm: 0,
  ks: { o: { a: 1, k: [
    { t: 0, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 6, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 12, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 18, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 24, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 30, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 36, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 42, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 48, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 54, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 60, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 66, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 72, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
    { t: 78, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
    { t: 84, s: [100], e: [100], i: EASE_OUT, o: EASE_IN },
  ] }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 118, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
  ao: 0,
  shapes: [{
    ty: 'gr', nm: 'dot-g', bm: 0,
    it: [
      { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [14, 14] } },
      { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 100 } },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ],
  }],
};

const liveBalanceLottie: LottieSceneData = {
  v: '5.7.4', fr: 30, ip: 0, op: 90, w: 200, h: 200, nm: 'balance', ddd: 0, assets: [], markers: [],
  layers: [
    bar('bar-l', 1, 44, 74, [1, 0.66, 0.23, 1], 100, 0),
    bar('bar-c', 2, 100, 112, [1, 0.31, 0, 1], 100, 8),
    bar('bar-r', 3, 156, 92, [1, 0.93, 0.84, 1], 70, 16),
    blinkDot,
  ],
};

// ── 4. Your waiter, one tap away (ripple) ───────────────────────────────────
// A button that pulses; two rings ripple outward like a "call" signal.
const rippleRing = (name: string, ind: number, start: number, size: number, strokeColor: number[]) => ({
  ddd: 0, ind, ty: 4, nm: name, sr: 1, ip: start, op: start + 30, st: start, bm: 0,
  ks: {
    o: { a: 1, k: [
      { t: 0, s: [100], e: [0], i: EASE_OUT, o: EASE_IN },
      { t: 28, s: [0], e: [0], i: EASE_OUT, o: EASE_IN },
    ] },
    r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
    s: { a: 1, k: [
      { t: 0, s: [100, 100, 100], e: [270, 270, 100], i: EASE_OUT, o: EASE_IN },
      { t: 28, s: [270, 270, 100], e: [270, 270, 100], i: EASE_OUT, o: EASE_IN },
    ] },
  },
  ao: 0,
  shapes: [{
    ty: 'gr', nm: `${name}-g`, bm: 0,
    it: [
      { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] } },
      { ty: 'st', c: { a: 0, k: strokeColor }, o: { a: 0, k: 100 }, w: { a: 0, k: 10 }, lc: 2, lj: 2 },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ],
  }],
});

const waiterTapLottie: LottieSceneData = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'waiter-tap', ddd: 0, assets: [], markers: [],
  layers: [
    rippleRing('ring-1', 1, 2, 42, [1, 0.66, 0.23, 1]),
    rippleRing('ring-2', 2, 22, 42, [1, 0.93, 0.84, 1]),
    {
      ddd: 0, ind: 3, ty: 4, nm: 'core', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [100, 100, 100], e: [90, 90, 100], i: EASE_OUT, o: EASE_IN },
          { t: 30, s: [90, 90, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
        ] },
      },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'core-g', bm: 0,
        it: [
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [66, 66] } },
          { ty: 'fl', c: { a: 0, k: [1, 0.31, 0, 1] }, o: { a: 0, k: 100 } },
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [26, 26] } },
          { ty: 'fl', c: { a: 0, k: [1, 0.93, 0.84, 1] }, o: { a: 0, k: 95 } },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
  ],
};

// ── 5. Rewarded every visit (star + confetti) ───────────────────────────────
// A five-point star pulses and rocks gently; confetti squares pop in.
const confetti = (name: string, ind: number, x: number, y: number, size: number, color: number[], start: number, rotation: number) => ({
  ddd: 0, ind, ty: 4, nm: name, sr: 1, ip: 0, op: 60, st: 0, bm: 0,
  ks: {
    o: { a: 1, k: [
      { t: start, s: [0], e: [100], i: EASE_OUT, o: EASE_IN },
      { t: start + 8, s: [100], e: [100], i: EASE_OUT, o: EASE_IN },
    ] },
    r: { a: 0, k: rotation }, p: { a: 0, k: [x, y, 0] }, a: { a: 0, k: [0, 0, 0] },
    s: { a: 1, k: [
      { t: start, s: [0, 0, 100], e: [120, 120, 100], i: POP_IN, o: SNAP },
      { t: start + 8, s: [120, 120, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
    ] },
  },
  ao: 0,
  shapes: [{
    ty: 'gr', nm: `${name}-g`, bm: 0,
    it: [
      { ty: 'rc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] }, r: { a: 0, k: 4 } },
      { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 } },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
    ],
  }],
});

const rewardsLottie: LottieSceneData = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'rewards', ddd: 0, assets: [], markers: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'star', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [
          { t: 0, s: [-5], e: [5], i: EASE_OUT, o: EASE_IN },
          { t: 28, s: [5], e: [-5], i: EASE_OUT, o: EASE_IN },
          { t: 56, s: [-5], e: [5], i: EASE_OUT, o: EASE_IN },
        ] },
        p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [100, 100, 100], e: [114, 114, 100], i: EASE_OUT, o: EASE_IN },
          { t: 28, s: [114, 114, 100], e: [100, 100, 100], i: EASE_OUT, o: EASE_IN },
        ] },
      },
      ao: 0,
      shapes: [{
        ty: 'gr', nm: 'star-g', bm: 0,
        it: [
          { ty: 'sh', ks: { a: 0, k: { c: true, i: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], o: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], v: [[0, -64, 0], [15.28, -21.03, 0], [60.87, -19.78, 0], [24.73, 8.03, 0], [37.62, 51.78, 0], [0, 26, 0], [-37.62, 51.78, 0], [-24.73, 8.03, 0], [-60.87, -19.78, 0], [-15.28, -21.03, 0]] } } },
          { ty: 'fl', c: { a: 0, k: [1, 0.66, 0.23, 1] }, o: { a: 0, k: 100 } },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
        ],
      }],
    },
    confetti('confetti-1', 2, 152, 34, 18, [1, 0.31, 0, 1], 6, 14),
    confetti('confetti-2', 3, 38, 172, 14, [1, 0.93, 0.84, 1], 18, 22),
  ],
};

export const tabezaBenefitLotties = {
  open: openTabLottie,
  pay: payLottie,
  balance: liveBalanceLottie,
  waiter: waiterTapLottie,
  rewards: rewardsLottie,
} as const;