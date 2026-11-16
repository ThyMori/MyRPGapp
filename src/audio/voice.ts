// Voix synthétisée (synthèse « à formants », Web Audio, aucun fichier) : une source vocale (onde en dents de scie) passe dans trois
// filtres dont les fréquences dessinent les voyelles ; les consonnes sont des bruits filtrés. Sert à « prononcer » une courte
// formule en elfique (réussite) ou en langue noire (échec). La voix est volontairement robotique : c'est une voix de jeu d'arcade.

// Fréquences des trois formants (Hz) de chaque son voisé : voyelles, puis consonnes voisées (n, r, l, y, w, z…).
const FORMANTS: Record<string, [number, number, number]> = {
  a: [800, 1200, 2500], e: [520, 1850, 2500], i: [300, 2300, 3000], o: [500, 900, 2500], u: [320, 800, 2400],
  n: [250, 1500, 2600], r: [450, 1300, 1700], l: [350, 1100, 2700], y: [280, 2200, 3000], m: [250, 1000, 2200], b: [300, 900, 2300], d: [300, 1700, 2600], g: [300, 1400, 2300],
};

// Une consonne bruitée : bande de fréquences (Hz), largeur (Q), durée par défaut (s) et volume.
const BRUITS: Record<string, { f: number; q: number; dur: number; vol: number }> = {
  s: { f: 6500, q: 1.2, dur: 0.16, vol: 0.5 }, sh: { f: 3200, q: 1, dur: 0.2, vol: 0.55 }, h: { f: 1800, q: 0.5, dur: 0.1, vol: 0.3 },
  k: { f: 1500, q: 1, dur: 0.035, vol: 0.9 }, t: { f: 4200, q: 1, dur: 0.025, vol: 0.8 }, kh: { f: 900, q: 0.8, dur: 0.1, vol: 0.7 }, z: { f: 5000, q: 1.2, dur: 0.12, vol: 0.35 },
};

// Un événement de la formule : un son voisé (v) ou une consonne bruitée (n), à l'instant t (secondes) pour la durée dur.
export type Evenement =
  | { t: number; dur: number; v: string; f0: number; f0b?: number; vol?: number } // voisé : voyelle ou consonne voisée, hauteur de départ et d'arrivée (Hz)
  | { t: number; n: string; dur?: number; vol?: number }; // bruité : consonne

// Réglage de la voix : taille du conduit vocal (1 = normal, plus petit = plus aigu), vibrato, grondement et saturation.
export interface Voix {
  conduit: number; // multiplie les formants (0,8 grave, 1,15 clair)
  vibrato: number; // profondeur du vibrato en Hz (0 = aucun)
  grondement: number; // 0 à 1 : amplitude du grondement (modulation rapide du volume)
  saturation: number; // 0 à 1 : distorsion de la source (voix rauque)
  niveau: number; // volume de la voix (réglé d'après une mesure du pic : la voix claire est plus forte à réglage égal)
}

// Courbe de saturation (voix rauque). amount de 0 (aucune) à 1 (forte).
function courbe(amount: number): Float32Array<ArrayBuffer> {
  const n = 256; // nombre de points
  const c = new Float32Array(n); // la courbe
  const k = 1 + amount * 18; // dureté
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1; // de -1 à 1
    c[i] = Math.tanh(k * x) / Math.tanh(k); // écrête doucement
  }
  return c;
}

// Fait « parler » la formule sur le contexte c, branchée sur vers, à partir de l'instant t0. Rend la durée totale (secondes).
export function parler(c: BaseAudioContext, vers: AudioNode, t0: number, evts: Evenement[], voix: Voix, noise: AudioBuffer): number {
  const fin = Math.max(...evts.map((e) => e.t + ('dur' in e && e.dur ? e.dur : 0.2))) + 0.1; // fin de la formule
  const src = c.createOscillator(); // la source vocale
  src.type = 'sawtooth'; // riche en harmoniques, comme des cordes vocales
  const sat = c.createWaveShaper(); // saturation (voix rauque)
  sat.curve = courbe(voix.saturation);
  const porte = c.createGain(); // le volume de la voix (0 = la voix se tait)
  porte.gain.value = 0;
  src.connect(sat).connect(porte);
  if (voix.vibrato > 0) {
    const lfo = c.createOscillator(); // vibrato lent
    lfo.frequency.value = 5.6;
    const prof = c.createGain();
    prof.gain.value = voix.vibrato;
    lfo.connect(prof).connect(src.frequency);
    lfo.start(t0);
    lfo.stop(t0 + fin);
  }
  if (voix.grondement > 0) {
    const lfo = c.createOscillator(); // grondement : le volume vibre très vite
    lfo.frequency.value = 42;
    const prof = c.createGain();
    prof.gain.value = voix.grondement * 0.5;
    lfo.connect(prof).connect(porte.gain);
    lfo.start(t0);
    lfo.stop(t0 + fin);
  }
  const sortie = c.createGain(); // somme des trois formants
  sortie.gain.value = voix.niveau;
  sortie.connect(vers);
  const filtres: BiquadFilterNode[] = [0, 1, 2].map((i) => {
    const f = c.createBiquadFilter(); // un formant
    f.type = 'bandpass';
    f.Q.value = [9, 11, 12][i];
    const g = c.createGain(); // son poids
    g.gain.value = [1, 0.7, 0.35][i];
    porte.connect(f).connect(g).connect(sortie);
    return f;
  });
  const voises = evts.filter((e): e is Extract<Evenement, { v: string }> => 'v' in e).sort((a, b) => a.t - b.t); // sons voisés dans l'ordre
  src.frequency.setValueAtTime(voises[0]?.f0 ?? 120, t0);
  for (const e of voises) {
    const fm = FORMANTS[e.v] ?? FORMANTS.a; // formants du son
    const t = t0 + e.t; // instant de départ
    filtres.forEach((f, i) => f.frequency.linearRampToValueAtTime(fm[i] * voix.conduit, t + 0.03)); // la bouche prend la forme du son
    src.frequency.linearRampToValueAtTime(e.f0, t + 0.01); // hauteur de départ
    src.frequency.linearRampToValueAtTime(e.f0b ?? e.f0, t + e.dur); // hauteur d'arrivée
    const vol = e.vol ?? (e.v.length === 1 && 'aeiou'.includes(e.v) ? 1 : 0.55); // les consonnes voisées sont plus discrètes
    porte.gain.setTargetAtTime(vol, t, 0.015); // la voix s'allume
    porte.gain.setTargetAtTime(0.0001, t + e.dur - 0.03, 0.02); // puis s'éteint (sauf si le son suivant la rallume)
  }
  for (const e of evts) {
    if (!('n' in e)) continue; // seulement les consonnes bruitées
    const b = BRUITS[e.n]; // réglage de cette consonne
    const s = c.createBufferSource(); // le bruit
    s.buffer = noise;
    const f = c.createBiquadFilter(); // sa bande de fréquences
    f.type = 'bandpass';
    f.frequency.value = b.f * (voix.conduit > 1 ? 1.1 : 0.9);
    f.Q.value = b.q;
    const g = c.createGain(); // son enveloppe
    const d = e.dur ?? b.dur;
    const t = t0 + e.t;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime((e.vol ?? 1) * b.vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f).connect(g).connect(vers);
    s.start(t);
    s.stop(t + d + 0.02);
  }
  src.start(t0);
  src.stop(t0 + fin);
  return fin;
}

// « Aiya Eärendil ! » (« Salut, Eärendil ! », elfique de Tolkien) : chantée, claire, qui monte jusqu'à une note tenue avec vibrato.
export const ELFIQUE: Evenement[] = [
  { t: 0.0, dur: 0.17, v: 'a', f0: 330, f0b: 350 }, { t: 0.17, dur: 0.13, v: 'i', f0: 370 }, // « ai »
  { t: 0.3, dur: 0.06, v: 'y', f0: 392, vol: 0.6 }, { t: 0.36, dur: 0.22, v: 'a', f0: 392, f0b: 415 }, // « ya »
  { t: 0.62, dur: 0.17, v: 'e', f0: 440, f0b: 466 }, { t: 0.79, dur: 0.15, v: 'a', f0: 466 }, // « eä »
  { t: 0.96, dur: 0.07, v: 'r', f0: 494, vol: 0.7 }, { t: 1.03, dur: 0.2, v: 'e', f0: 523 }, { t: 1.23, dur: 0.08, v: 'n', f0: 523, vol: 0.6 }, // « ren »
  { t: 1.34, n: 'k', dur: 0.025, vol: 0.5 }, // la consonne d'attaque de « dil » (un « d » sec)
  { t: 1.36, dur: 0.75, v: 'i', f0: 587, f0b: 659 }, { t: 2.11, dur: 0.14, v: 'l', f0: 659, vol: 0.6 }, // « dil » tenu
];
export const VOIX_ELFE: Voix = { conduit: 1.14, vibrato: 5, grondement: 0, saturation: 0.05, niveau: 0.7 }; // voix claire, vibrato

// « Ash nazg durbatulûk ! » (« Un anneau pour les gouverner tous », langue noire de Tolkien) : grave, rauque, qui descend.
export const NOIR: Evenement[] = [
  { t: 0.0, dur: 0.22, v: 'a', f0: 92, f0b: 84 }, { t: 0.22, n: 'sh', dur: 0.22 }, // « ash »
  { t: 0.5, dur: 0.07, v: 'n', f0: 82, vol: 0.7 }, { t: 0.57, dur: 0.14, v: 'a', f0: 80 }, { t: 0.71, n: 'z', dur: 0.1 }, { t: 0.81, n: 'kh', dur: 0.1 }, // « nazg »
  { t: 1.0, n: 't', dur: 0.03, vol: 0.7 }, { t: 1.02, dur: 0.16, v: 'u', f0: 78, f0b: 72 }, { t: 1.18, dur: 0.1, v: 'r', f0: 72, vol: 0.8 }, // « dur »
  { t: 1.3, dur: 0.05, v: 'b', f0: 72, vol: 0.7 }, { t: 1.35, dur: 0.12, v: 'a', f0: 70 }, // « ba »
  { t: 1.5, n: 't', dur: 0.03, vol: 0.7 }, { t: 1.52, dur: 0.1, v: 'u', f0: 68 }, { t: 1.62, dur: 0.08, v: 'l', f0: 66, vol: 0.7 }, // « tul »
  { t: 1.72, dur: 0.4, v: 'u', f0: 64, f0b: 48 }, { t: 2.12, n: 'k', dur: 0.05, vol: 1 }, // « ûk »
];
export const VOIX_ORC: Voix = { conduit: 0.82, vibrato: 0, grondement: 0.8, saturation: 0.85, niveau: 1.9 }; // voix grave, rauque, qui gronde
