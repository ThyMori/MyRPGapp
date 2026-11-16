import { audioContext, fadeOutAndDisconnect, noiseBuffer } from './core'; // contexte audio et bruit partagés

// Sons des dés, fabriqués par l'appareil avec l'API Web Audio : aucun fichier son à télécharger, donc rien à mettre en cache.
// Un lancer = un léger roulement + un « toc » à chaque rebond sur la table et à chaque choc contre un bord.

// Un choc à jouer : instant (secondes après le début du lancer), force (0 à 1), nature.
export interface SoundEvent {
  at: number; // instant du choc, en secondes
  strength: number; // force du choc
  kind: 'floor' | 'wall'; // table (sec et aigu) ou bord (plus sourd et plus long)
}

let courant: GainNode | null = null; // volume du lancer en cours (pour pouvoir le couper)

// Joue un choc à l'instant `quand` (horloge du contexte) : un claquement de bruit filtré + un petit « corps » grave.
function choc(c: AudioContext, sortie: AudioNode, quand: number, force: number, nature: 'floor' | 'wall'): void {
  const mur = nature === 'wall'; // choc contre un bord ?
  const src = c.createBufferSource(); // source de bruit
  src.buffer = noiseBuffer(c); // le bruit blanc
  src.playbackRate.value = 0.8 + Math.random() * 0.5; // varie le grain d'un choc à l'autre
  const filtre = c.createBiquadFilter(); // filtre passe-bande : donne le timbre « dur »
  filtre.type = 'bandpass'; // ne garde qu'une bande de fréquences
  filtre.frequency.value = mur ? 900 + Math.random() * 400 : 1700 + Math.random() * 1500; // un bord sonne plus sourd que la table
  filtre.Q.value = 1.1; // largeur de la bande
  const g = c.createGain(); // enveloppe de volume du claquement
  g.gain.setValueAtTime(0, quand); // silence avant le choc
  g.gain.linearRampToValueAtTime(0.55 * force, quand + 0.002); // attaque quasi instantanée
  g.gain.exponentialRampToValueAtTime(0.0005, quand + (mur ? 0.11 : 0.07)); // extinction rapide
  src.connect(filtre).connect(g).connect(sortie); // chaîne : bruit → filtre → enveloppe → sortie
  src.start(quand, Math.random() * 0.5); // démarre à un endroit aléatoire du bruit
  src.stop(quand + 0.15); // coupe après la fin de l'extinction
  const osc = c.createOscillator(); // petit « corps » grave du dé
  osc.type = 'sine'; // son pur
  osc.frequency.setValueAtTime(mur ? 140 : 210 + Math.random() * 40, quand); // hauteur de départ
  osc.frequency.exponentialRampToValueAtTime(70, quand + 0.09); // qui descend vite
  const og = c.createGain(); // enveloppe du corps
  og.gain.setValueAtTime(0, quand); // silence avant le choc
  og.gain.linearRampToValueAtTime(0.38 * force, quand + 0.003); // attaque
  og.gain.exponentialRampToValueAtTime(0.0005, quand + 0.1); // extinction
  osc.connect(og).connect(sortie); // chaîne : oscillateur → enveloppe → sortie
  osc.start(quand); // démarre
  osc.stop(quand + 0.12); // coupe
}

// Joue le son d'un lancer. events = tous les chocs de tous les dés ; duree = durée du lancer (s) ; nbDes sert à baisser le volume
// quand beaucoup de dés tombent ensemble.
export function startDiceSound(events: SoundEvent[], duree: number, nbDes: number): void {
  stopDiceSound(); // coupe un éventuel lancer précédent
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  const sortie = c.createGain(); // volume de ce lancer
  sortie.gain.value = Math.min(1, 1.6 / Math.sqrt(Math.max(1, nbDes))) * 0.8; // moins fort avec beaucoup de dés
  sortie.connect(c.destination); // vers les haut-parleurs
  courant = sortie; // mémorise pour pouvoir le couper
  const t0 = c.currentTime + 0.02; // départ, avec une petite marge pour que tout soit bien programmé
  const roule = c.createBufferSource(); // le roulement : bruit grave qui monte puis s'éteint
  roule.buffer = noiseBuffer(c); // bruit blanc
  roule.loop = true; // en boucle pendant tout le lancer
  const grave = c.createBiquadFilter(); // passe-bas : ne garde que le grondement
  grave.type = 'lowpass'; // laisse passer les graves
  grave.frequency.value = 520; // fréquence de coupure
  const gr = c.createGain(); // enveloppe du roulement
  gr.gain.setValueAtTime(0, t0); // silence au départ
  gr.gain.linearRampToValueAtTime(0.1, t0 + 0.12); // monte vite
  gr.gain.linearRampToValueAtTime(0, t0 + Math.max(0.3, duree * 0.85)); // s'éteint avant l'arrivée
  roule.connect(grave).connect(gr).connect(sortie); // chaîne du roulement
  roule.start(t0); // démarre
  roule.stop(t0 + duree + 0.1); // coupe à la fin
  for (const e of events) {
    if (e.at < 0 || e.at > 4) continue; // ignore les instants absurdes
    choc(c, sortie, t0 + e.at, Math.min(1, Math.max(0.05, e.strength)), e.kind); // programme le choc
  }
}

// Coupe tout de suite le son du lancer en cours (appui pendant le lancer, nouveau lancer…).
export function stopDiceSound(): void {
  const s = courant; // lancer en cours
  courant = null; // plus rien en cours
  const c = audioContext(); // contexte
  if (s && c) fadeOutAndDisconnect(c, s); // coupe en douceur
}

// Petit « toc toc » pour confirmer qu'on vient d'activer le son.
export function previewDiceSound(): void {
  startDiceSound([{ at: 0, strength: 0.8, kind: 'floor' }, { at: 0.14, strength: 0.45, kind: 'floor' }], 0.3, 1); // deux chocs
}
