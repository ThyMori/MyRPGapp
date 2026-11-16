// Sons des « présages » : l'Œil de Sauron (inquiétant) et la rune de Gandalf (féerique). Synthèse Web Audio, aucun fichier.
// Chaque son dure environ 2,8 s et suit le même découpage que l'animation (src/styles/omens.css).
import { audioContext, fadeOutAndDisconnect, noiseBuffer } from './core'; // contexte audio et bruit partagés

let courant: GainNode | null = null; // volume du présage en cours (pour pouvoir le couper)

// Prépare la sortie d'un nouveau présage : coupe le précédent et rend un volume général branché aux haut-parleurs.
function sortie(c: AudioContext): GainNode {
  stopOmenSound(); // un seul présage à la fois
  const g = c.createGain(); // volume général
  g.gain.value = 0.8; // niveau général : les présages restent plus discrets que le pire des chocs de dés
  g.connect(c.destination); // vers les haut-parleurs
  courant = g; // mémorise pour pouvoir le couper
  return g;
}

// Une « voix » : un oscillateur dont le volume monte (attaque), tient, puis redescend à zéro. Les instants sont en secondes sur l'horloge audio.
function voix(c: AudioContext, vers: AudioNode, type: OscillatorType, freq: number, debut: number, fin: number, crete: number, attaque: number, glisse?: number): void {
  const o = c.createOscillator(); // la source
  o.type = type; // forme d'onde
  o.frequency.setValueAtTime(freq, debut); // hauteur de départ
  if (glisse) o.frequency.exponentialRampToValueAtTime(glisse, fin); // glissement éventuel vers une autre hauteur
  const g = c.createGain(); // enveloppe de volume
  g.gain.setValueAtTime(0, debut); // silence au départ
  g.gain.linearRampToValueAtTime(crete, debut + attaque); // monte jusqu'à la crête
  g.gain.linearRampToValueAtTime(0, fin); // redescend jusqu'à la fin
  o.connect(g).connect(vers); // chaîne : source → enveloppe → destination
  o.start(debut); // démarre
  o.stop(fin + 0.05); // coupe juste après
}

// Un coup sourd, comme un battement de cœur (grosse caisse lointaine).
function battement(c: AudioContext, vers: AudioNode, t: number, force: number): void {
  const o = c.createOscillator(); // la source
  o.type = 'sine'; // son pur
  o.frequency.setValueAtTime(75, t); // part d'un grave
  o.frequency.exponentialRampToValueAtTime(36, t + 0.18); // qui s'effondre
  const g = c.createGain(); // enveloppe
  g.gain.setValueAtTime(0, t); // silence avant le coup
  g.gain.linearRampToValueAtTime(force, t + 0.006); // attaque nette
  g.gain.exponentialRampToValueAtTime(0.0005, t + 0.26); // extinction
  o.connect(g).connect(vers); // chaîne
  o.start(t); // démarre
  o.stop(t + 0.3); // coupe
}

// Un bruit filtré (souffle, air) : bande de fréquences qui glisse de fa à fb, volume qui monte puis redescend.
function souffle(c: AudioContext, vers: AudioNode, type: BiquadFilterType, fa: number, fb: number, q: number, debut: number, fin: number, crete: number): void {
  const s = c.createBufferSource(); // le bruit
  s.buffer = noiseBuffer(c); // bruit blanc
  s.loop = true; // en boucle
  const f = c.createBiquadFilter(); // le filtre
  f.type = type; // forme du filtre
  f.Q.value = q; // étroitesse
  f.frequency.setValueAtTime(fa, debut); // fréquence de départ
  f.frequency.linearRampToValueAtTime(fb, fin); // fréquence d'arrivée
  const g = c.createGain(); // enveloppe
  g.gain.setValueAtTime(0, debut); // silence au départ
  g.gain.linearRampToValueAtTime(crete, debut + (fin - debut) * 0.55); // monte
  g.gain.linearRampToValueAtTime(0, fin); // redescend
  s.connect(f).connect(g).connect(vers); // chaîne
  s.start(debut); // démarre
  s.stop(fin + 0.05); // coupe
}

// L'Œil de Sauron : grondement qui monte, cœur qui bat, souffle sinistre, puis un coup de cor grave et dissonant quand l'Œil vous trouve.
export function playEyeSound(): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  const out = sortie(c); // volume général
  const t0 = c.currentTime + 0.03; // départ, avec une petite marge
  const grave = c.createBiquadFilter(); // filtre du grondement : il s'ouvre quand l'Œil se tourne vers vous
  grave.type = 'lowpass'; // ne garde que les graves
  grave.frequency.setValueAtTime(110, t0); // fermé au départ
  grave.frequency.linearRampToValueAtTime(700, t0 + 1.9); // s'ouvre jusqu'au moment où l'Œil vous trouve
  grave.frequency.linearRampToValueAtTime(180, t0 + 2.8); // se referme ensuite
  grave.connect(out); // vers la sortie
  voix(c, grave, 'sawtooth', 48, t0, t0 + 2.8, 0.2, 1.3); // grondement, première scie
  voix(c, grave, 'sawtooth', 50.3, t0, t0 + 2.8, 0.2, 1.3); // seconde scie un peu désaccordée : un battement lent, malsain
  voix(c, grave, 'sine', 68, t0, t0 + 2.8, 0.14, 1.5); // un triton au-dessus : l'intervalle du malaise
  for (const [t, f] of [[0.7, 0.85], [0.95, 0.55], [1.6, 1], [1.85, 0.65]] as const) battement(c, out, t0 + t, f); // deux « lub-dub » de cœur
  souffle(c, out, 'bandpass', 700, 2600, 4, t0 + 0.7, t0 + 2.3, 0.09); // souffle sinistre qui monte
  voix(c, grave, 'sawtooth', 98, t0 + 1.9, t0 + 3.0, 0.32, 0.05); // coup de cor : l'Œil vous a trouvé
  voix(c, grave, 'sawtooth', 103.5, t0 + 1.9, t0 + 3.0, 0.3, 0.05); // le cor, désaccordé
  voix(c, out, 'sine', 1760, t0 + 1.95, t0 + 2.9, 0.035, 0.02); // scintillement aigu…
  voix(c, out, 'sine', 1864, t0 + 1.95, t0 + 2.9, 0.035, 0.02); // …dissonant avec le précédent (demi-ton)
}

// La rune de Gandalf : carillon ascendant, voile lumineux, scintillements, avec un écho qui s'éteint doucement.
export function playGandalfSound(): void {
  const c = audioContext(); // contexte audio
  if (!c) return; // pas de son possible
  const out = sortie(c); // volume général
  const t0 = c.currentTime + 0.03; // départ
  const sec = c.createGain(); // son direct
  sec.connect(out); // vers la sortie
  const retard = c.createDelay(1); // écho
  retard.delayTime.value = 0.23; // un quart de seconde
  const retour = c.createGain(); // part du son renvoyée dans l'écho
  retour.gain.value = 0.36; // l'écho s'éteint peu à peu
  const doux = c.createBiquadFilter(); // adoucit l'écho à chaque passage (il s'assombrit comme un vrai écho)
  doux.type = 'lowpass'; // ne garde que les fréquences basses
  doux.frequency.value = 3200; // coupure
  const humide = c.createGain(); // niveau de l'écho dans le mélange
  humide.gain.value = 0.55; // niveau
  sec.connect(retard); // le son direct nourrit l'écho
  retard.connect(doux).connect(retour).connect(retard); // boucle de l'écho
  doux.connect(humide).connect(out); // l'écho est aussi envoyé à la sortie
  const cloche = (f: number, t: number, crete: number) => {
    voix(c, sec, 'sine', f, t, t + 1.5, crete, 0.004); // la note
    voix(c, sec, 'sine', f * 2.76, t, t + 0.8, crete * 0.22, 0.004); // un harmonique inharmonique : le timbre de cloche
  };
  cloche(2093, t0 + 0.6, 0.12); // tintement quand le bâton s'embrase
  cloche(3136, t0 + 0.6, 0.06); // et sa quinte
  [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98].forEach((f, i) => cloche(f, t0 + 0.7 + i * 0.11, 0.14)); // arpège ascendant (do majeur lydien)
  for (const f of [261.63, 392, 659.25]) voix(c, sec, 'sine', f, t0 + 0.3, t0 + 2.7, 0.05, 1.1); // voile lumineux : accord qui gonfle puis s'éteint
  souffle(c, sec, 'highpass', 5200, 5200, 0.7, t0 + 0.6, t0 + 2.5, 0.03); // air scintillant
  for (let i = 0; i < 14; i++) {
    const d = t0 + 0.9 + Math.random() * 1.6; // instant de l'étincelle
    voix(c, sec, 'sine', 3000 + Math.random() * 3500, d, d + 0.06, 0.045, 0.004); // une étincelle aiguë très courte
  }
}

// Coupe tout de suite le présage en cours (appui sur l'écran, nouveau lancer…).
export function stopOmenSound(): void {
  const s = courant; // présage en cours
  courant = null; // plus rien en cours
  const c = audioContext(); // contexte
  if (s && c) fadeOutAndDisconnect(c, s); // coupe en douceur
}
