// Battements de cœur des dés qui se flétrissent (état Épuisé). Synthèse Web Audio, aucun fichier.
// Les instants viennent de src/dice3d/wither.ts : le son et l'animation restent synchronisés.
import { BATTEMENTS, WITHER_DUREE_S } from '../dice3d/wither'; // instants et forces des battements
import { audioContext, fadeOutAndDisconnect } from './core'; // contexte audio partagé

let courant: GainNode | null = null; // volume du son en cours (pour pouvoir le couper)

// Joue les battements. nbDes = nombre de dés qui se flétrissent (plus il y en a, plus c'est plein).
export function playHeartbeat(nbDes: number): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  stopHeartbeat(); // un seul à la fois
  const out = c.createGain(); // volume général
  out.gain.value = Math.min(0.9, 0.55 + nbDes * 0.08); // un peu plus fort avec le nombre de dés
  out.connect(c.destination); // vers les haut-parleurs
  courant = out; // mémorise
  const t0 = c.currentTime + 0.02; // départ
  const sourd = c.createBiquadFilter(); // filtre qui étouffe le son, comme un cœur entendu à travers un mur
  sourd.type = 'lowpass'; // garde les graves
  sourd.frequency.setValueAtTime(260, t0); // net au début
  sourd.frequency.linearRampToValueAtTime(110, t0 + WITHER_DUREE_S); // de plus en plus étouffé
  sourd.connect(out); // vers la sortie
  BATTEMENTS.forEach(([t, force], i) => {
    const o = c.createOscillator(); // la source
    o.type = 'sine'; // son pur et rond
    const grave = i % 2 === 0 ? 62 : 54; // le « lub » est un peu plus haut que le « dub »
    o.frequency.setValueAtTime(grave * 1.5, t0 + t); // part plus haut
    o.frequency.exponentialRampToValueAtTime(grave * 0.6, t0 + t + 0.14); // puis s'effondre
    const g = c.createGain(); // enveloppe
    const v = 0.9 * force; // volume de ce battement
    g.gain.setValueAtTime(0, t0 + t); // silence avant le coup
    g.gain.linearRampToValueAtTime(v, t0 + t + 0.012); // attaque
    g.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.22); // extinction
    o.connect(g).connect(sourd); // chaîne
    o.start(t0 + t); // démarre
    o.stop(t0 + t + 0.25); // coupe
  });
}

// Coupe tout de suite (nouveau lancer, appui…).
export function stopHeartbeat(): void {
  const s = courant; // son en cours
  courant = null; // plus rien en cours
  const c = audioContext(); // contexte
  if (s && c) fadeOutAndDisconnect(c, s); // coupe en douceur
}
