// Battements de cœur des dés qui se flétrissent (état Épuisé). Synthèse Web Audio, aucun fichier.
// Les instants viennent de src/dice3d/wither.ts : le son et l'animation restent synchronisés.
import { BATTEMENTS, WITHER_DUREE_S } from '../dice3d/wither'; // instants et forces des battements
import { audioContext, fadeOutAndDisconnect, noiseBuffer } from './core'; // contexte audio partagé

let courant: GainNode | null = null; // volume du son en cours (pour pouvoir le couper)

// Joue les battements. nbDes = nombre de dés qui se flétrissent (plus il y en a, plus c'est plein).
export function playHeartbeat(nbDes: number): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  stopHeartbeat(); // un seul à la fois
  const out = c.createGain(); // volume général
  out.gain.value = Math.min(1, 0.85 + nbDes * 0.03); // franc : le cœur doit s'entendre même sur un petit haut-parleur
  out.connect(c.destination); // vers les haut-parleurs
  courant = out; // mémorise
  const t0 = c.currentTime + 0.02; // départ
  const sourd = c.createBiquadFilter(); // filtre qui arrondit le son sans l'étouffer (les graves purs sont inaudibles sur un téléphone)
  sourd.type = 'lowpass'; // garde les graves et les médiums bas
  sourd.frequency.setValueAtTime(900, t0); // ouvert au départ
  sourd.frequency.linearRampToValueAtTime(500, t0 + WITHER_DUREE_S); // se referme un peu : le cœur s'éloigne
  sourd.connect(out); // vers la sortie
  BATTEMENTS.forEach(([t, force], i) => {
    const base = i % 2 === 0 ? 120 : 98; // le « lub » est un peu plus haut que le « dub »
    for (const [mult, type, vol] of [[1, 'sine', 1], [2, 'triangle', 0.6]] as const) { // fondamental + octave : l'octave se fait entendre sur un haut-parleur de téléphone
      const o = c.createOscillator(); // la source
      o.type = type; // forme d'onde
      o.frequency.setValueAtTime(base * mult, t0 + t); // part de la hauteur de base
      o.frequency.exponentialRampToValueAtTime(base * mult * 0.45, t0 + t + 0.16); // puis s'effondre : un « poum » sourd
      const g = c.createGain(); // enveloppe
      g.gain.setValueAtTime(0, t0 + t); // silence avant le coup
      g.gain.linearRampToValueAtTime(vol * force, t0 + t + 0.01); // attaque nette
      g.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.26); // extinction
      o.connect(g).connect(sourd); // chaîne
      o.start(t0 + t); // démarre
      o.stop(t0 + t + 0.3); // coupe
    }
    const s = c.createBufferSource(); // petit « claquement » de la membrane au début du coup
    s.buffer = noiseBuffer(c); // bruit blanc
    const f = c.createBiquadFilter(); // le filtre
    f.type = 'bandpass'; // une bande médium
    f.frequency.value = 450; // fréquence centrale
    const gc = c.createGain(); // enveloppe du claquement
    gc.gain.setValueAtTime(0.5 * force, t0 + t); // fort au départ
    gc.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.05); // très bref
    s.connect(f).connect(gc).connect(out); // chaîne
    s.start(t0 + t); // démarre
    s.stop(t0 + t + 0.06); // coupe
  });
}

// Coupe tout de suite (nouveau lancer, appui…).
export function stopHeartbeat(): void {
  const s = courant; // son en cours
  courant = null; // plus rien en cours
  const c = audioContext(); // contexte
  if (s && c) fadeOutAndDisconnect(c, s); // coupe en douceur
}
