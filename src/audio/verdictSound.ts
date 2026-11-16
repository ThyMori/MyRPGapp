// Sons de l'annonce « RÉUSSITE » / « ÉCHEC » : petites fanfares façon jeu d'arcade (ondes carrées), sans fichier ni voix.
// Réussite : fanfare qui monte avec un accord final ; échec : notes qui s'affaissent. Les deux suivent la chute des lettres (0,25 s).
import { audioContext, noiseBuffer } from './core'; // contexte audio et bruit partagés
import { sortie } from './omenSound'; // volume général (coupé par stopOmenSound)

// Une note « 8 bits » : deux ondes carrées légèrement désaccordées, un filtre qui adoucit, un vibrato facultatif.
// glisse = hauteur d'arrivée (si la note glisse), vib = profondeur du vibrato en Hz.
function note(c: AudioContext, vers: AudioNode, freq: number, t: number, duree: number, vol: number, glisse?: number, vib = 0): void {
  const g = c.createGain(); // enveloppe
  g.gain.setValueAtTime(0, t); // silence avant la note
  g.gain.linearRampToValueAtTime(vol, t + 0.01); // attaque nette
  g.gain.setValueAtTime(vol, t + duree * 0.7); // tient
  g.gain.linearRampToValueAtTime(0, t + duree); // relâche
  const f = c.createBiquadFilter(); // adoucit le côté strident
  f.type = 'lowpass';
  f.frequency.value = 3800;
  g.connect(f).connect(vers);
  for (const d of [1, 1.006]) { // deux ondes : un petit battement, comme un vieux circuit sonore
    const o = c.createOscillator(); // la source
    o.type = 'square'; // onde carrée : le son des bornes d'arcade
    o.frequency.setValueAtTime(freq * d, t);
    if (glisse) o.frequency.exponentialRampToValueAtTime(glisse * d, t + duree); // glissando
    if (vib > 0) {
      const lfo = c.createOscillator(); // vibrato
      lfo.frequency.value = 6.5;
      const prof = c.createGain();
      prof.gain.value = vib;
      lfo.connect(prof).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + duree + 0.05);
    }
    o.connect(g);
    o.start(t);
    o.stop(t + duree + 0.05);
  }
}

// Le choc de l'annonce qui s'écrase : un coup grave et une gerbe de bruit.
function choc(c: AudioContext, vers: AudioNode, t: number): void {
  const o = c.createOscillator(); // le coup grave
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  const g = c.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g).connect(vers);
  o.start(t);
  o.stop(t + 0.35);
  const s = c.createBufferSource(); // la gerbe de bruit
  s.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 1500;
  const gn = c.createGain();
  gn.gain.setValueAtTime(0.35, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  s.connect(f).connect(gn).connect(vers);
  s.start(t);
  s.stop(t + 0.25);
}

// Une « syllabe » criée : une scie qui passe dans un filtre à bande mobile, ce qui imite une voyelle (sans parler vraiment).
function cri(c: AudioContext, vers: AudioNode, t: number, duree: number, hauteur: number, fa: number, fb: number, vol: number): void {
  const o = c.createOscillator(); // les cordes vocales
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(hauteur, t);
  o.frequency.linearRampToValueAtTime(hauteur * 0.92, t + duree);
  const f = c.createBiquadFilter(); // la bouche : la bande de fréquences glisse
  f.type = 'bandpass';
  f.Q.value = 3.5;
  f.frequency.setValueAtTime(fa, t);
  f.frequency.linearRampToValueAtTime(fb, t + duree);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.linearRampToValueAtTime(0, t + duree);
  o.connect(f).connect(g).connect(vers);
  o.start(t);
  o.stop(t + duree + 0.05);
}

// Joue l'annonce : win = réussite (fanfare), sinon échec (notes qui s'affaissent). Durée d'environ 2,4 s.
export function playVerdictSound(win: boolean): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  const out = sortie(c); // volume général
  const t0 = c.currentTime + 0.03; // départ
  const e = t0 + 0.25; // instant où le mot s'écrase
  choc(c, out, e); // le choc
  if (win) {
    cri(c, out, e, 0.28, 190, 500, 1100, 0.12); // « YOU » (voyelle qui s'ouvre)
    cri(c, out, e + 0.34, 0.4, 220, 800, 1900, 0.12); // « WIN » (voyelle claire)
    const fanfare: [number, number, number][] = [[0.8, 523.3, 0.12], [0.95, 523.3, 0.12], [1.1, 523.3, 0.12], [1.25, 659.3, 0.3], [1.6, 784, 0.14], [1.78, 659.3, 0.14]]; // do do do mi sol mi : le motif de victoire
    for (const [dt, f, d] of fanfare) {
      note(c, out, f, t0 + dt, d, 0.1); // la mélodie
      note(c, out, f / 2, t0 + dt, d, 0.05); // doublée à l'octave grave
    }
    note(c, out, 1046.5, t0 + 1.95, 0.55, 0.1, undefined, 6); // do aigu tenu, avec vibrato
    note(c, out, 784, t0 + 1.95, 0.55, 0.07); // accord : sol…
    note(c, out, 659.3, t0 + 1.95, 0.55, 0.07); // …et mi
    note(c, out, 130.8, t0 + 1.95, 0.55, 0.12); // basse
  } else {
    cri(c, out, e, 0.35, 150, 900, 450, 0.12); // « YOU » (voyelle qui se ferme)
    cri(c, out, e + 0.42, 0.5, 120, 700, 300, 0.12); // « LOSE » (grave, qui s'éteint)
    const chute: [number, number][] = [[0.95, 329.6], [1.3, 311.1], [1.65, 293.7]]; // mi, mi bémol, ré : on descend
    for (const [dt, f] of chute) note(c, out, f, t0 + dt, 0.3, 0.1); // notes tristes
    note(c, out, 277.2, t0 + 2.0, 0.7, 0.1, 207.7, 14); // dernier do dièse qui glisse et tremble
    note(c, out, 69.3, t0 + 0.95, 1.8, 0.1, 49); // basse qui s'effondre
  }
}
