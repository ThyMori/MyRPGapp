// Sons de l'annonce « RÉUSSITE » / « ÉCHEC » : une formule prononcée par une voix synthétisée (src/audio/voice.ts).
// Réussite : « Aiya Eärendil ! » en elfique, chantée, sur un voile de chœur clair. Échec : « Ash nazg durbatulûk ! » en langue noire,
// grondée, sur un battement grave de tambour. Les deux suivent la chute de la bannière (0,3 s). Durée : environ 2,6 s.
import { audioContext, noiseBuffer } from './core'; // contexte audio et bruit partagés
import { sortie, voix } from './omenSound'; // volume général (coupé par stopOmenSound) et notes simples
import { ELFIQUE, NOIR, VOIX_ELFE, VOIX_ORC, parler } from './voice'; // voix synthétisée

// Le choc de la bannière qui s'écrase : un coup grave et une gerbe de bruit.
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
  gn.gain.setValueAtTime(0.3, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  s.connect(f).connect(gn).connect(vers);
  s.start(t);
  s.stop(t + 0.25);
}

// Un écho (retard avec retour filtré) pour donner du volume à la voix : clair pour l'elfe, sombre et long pour l'orc.
function echo(c: AudioContext, vers: AudioNode, retard: number, retour: number, coupe: number): AudioNode {
  const entree = c.createGain(); // entrée : la voix directe passe aussi sans écho
  entree.connect(vers);
  const d = c.createDelay(1); // le retard
  d.delayTime.value = retard;
  const fb = c.createGain(); // part renvoyée
  fb.gain.value = retour;
  const f = c.createBiquadFilter(); // l'écho s'adoucit à chaque tour
  f.type = 'lowpass';
  f.frequency.value = coupe;
  entree.connect(d);
  d.connect(f).connect(fb).connect(d);
  f.connect(vers);
  return entree;
}

// Joue l'annonce : win = réussite (elfique), sinon échec (langue noire).
export function playVerdictSound(win: boolean): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  const out = sortie(c); // volume général
  const t0 = c.currentTime + 0.03; // départ
  const e = t0 + 0.3; // instant où la bannière s'écrase
  choc(c, out, e); // le choc
  if (win) {
    const v = echo(c, out, 0.19, 0.38, 5000); // écho clair
    parler(c, v, e + 0.1, ELFIQUE, VOIX_ELFE, noiseBuffer(c)); // « Aiya Eärendil ! »
    for (const f of [329.6, 415.3, 493.9]) voix(c, out, 'triangle', f, e + 0.1, e + 2.5, 0.035, 0.9); // voile de chœur : accord de mi majeur qui s'élève
    voix(c, out, 'sine', 1318.5, e + 1.4, e + 2.6, 0.03, 0.05); // une note cristalline quand la voix atteint sa note tenue
  } else {
    const v = echo(c, out, 0.13, 0.5, 1800); // écho sombre, de caverne
    parler(c, v, e + 0.15, NOIR, VOIX_ORC, noiseBuffer(c)); // « Ash nazg durbatulûk ! »
    voix(c, out, 'sawtooth', 55, e, e + 2.4, 0.06, 0.8, 41); // drone grave qui s'enfonce
    for (const dt of [0.55, 1.0, 1.45, 1.9]) { // tambour lent
      const o = c.createOscillator(); // la peau du tambour
      o.type = 'sine';
      o.frequency.setValueAtTime(110, e + dt);
      o.frequency.exponentialRampToValueAtTime(45, e + dt + 0.2);
      const g = c.createGain();
      g.gain.setValueAtTime(0.5, e + dt);
      g.gain.exponentialRampToValueAtTime(0.001, e + dt + 0.3);
      o.connect(g).connect(out);
      o.start(e + dt);
      o.stop(e + dt + 0.35);
    }
  }
}
