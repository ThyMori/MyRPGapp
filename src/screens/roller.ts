// Écran « Lanceur de dés » : réglages, lancer, résultat, historique.
// Le hasard vient de src/rules (tirage cryptographique) ; la scène 3D ne fait que montrer le résultat tiré.
import { DiceStage } from '../dice3d/DiceStage'; // scène 3D plein écran
import { glyphSvg, type GlyphName } from '../dice3d/glyphs'; // symboles dessinés
import type { DieKind } from '../dice3d/layout'; // types de dés
import { cryptoRng } from '../rules/rng'; // tirage sûr
import { REGLES, evaluate, normalizeInput, rollRaw, type FeatFace, type Outcome, type RollInput } from '../rules/tor'; // règles de jet
import { dayLabel, timeLabel } from '../state/dayLabel'; // libellés de jour et d'heure
import { HISTORY_MAX, sanitizeHistory, sanitizeRollInput, type HistoryEntry } from '../state/settings'; // réglages mémorisés
import { loadJson, saveJson } from '../state/storage'; // mémoire locale
import { all, byId } from '../ui/dom'; // recherche d'éléments
import { tauShown, tauTier } from '../omen3d/tier'; // niveau de la fête des runes de réussite
import { closeOmen, playOmens, type Scene } from '../ui/omens'; // scènes de présage
import { initPrefs, soundEnabled } from '../ui/prefs'; // couleur des dés et son
import { showToast } from '../ui/toast'; // messages
import { VOCAB } from '../vocab'; // vocabulaire du jeu

let input: RollInput = sanitizeRollInput(undefined); // réglages courants
let history: HistoryEntry[] = []; // jets passés, du plus récent au plus ancien
let stage: DiceStage | null = null; // scène 3D (null si indisponible)

// Types de dés correspondant aux réglages : dé(s) du Destin d'abord, puis dés de Maîtrise.
function kindsFor(i: RollInput): DieKind[] {
  const nbFeat = i.mode === 'normal' ? 1 : 2; // deux dés du Destin si favorisé ou défavorisé
  return [...Array<DieKind>(nbFeat).fill('feat'), ...Array<DieKind>(i.pool).fill('success')]; // liste des dés
}

// Met l'affichage des réglages en accord avec l'état.
function syncUI(): void {
  byId('out-pool').textContent = String(input.pool); // nombre de dés de Maîtrise
  byId('out-tn').textContent = String(input.targetNumber); // SR
  for (const r of all<HTMLInputElement>('input[name="mode"]')) r.checked = r.value === input.mode; // mode du dé du Destin
  byId<HTMLInputElement>('chk-weary').checked = input.weary; // état Épuisé
  byId<HTMLInputElement>('chk-miserable').checked = input.miserable; // état Mélancolique
  for (const b of all<HTMLButtonElement>('[data-step]')) {
    const pool = b.dataset.step === 'pool'; // quel réglage ce bouton modifie
    const v = pool ? input.pool : input.targetNumber; // valeur actuelle
    const [min, max] = pool ? [0, REGLES.maitriseMax] : [REGLES.srMin, REGLES.srMax]; // bornes
    const dir = Number(b.dataset.dir); // sens du bouton (−1 ou +1)
    b.disabled = (dir < 0 && v <= min) || (dir > 0 && v >= max); // grise le bouton au bout de la plage
  }
}

// Modifie les réglages et les mémorise.
function change(patch: Partial<RollInput>): void {
  input = normalizeInput({ ...input, ...patch }); // réglages corrigés
  saveJson('roll', input); // mémorise
  syncUI(); // met l'affichage à jour
}

// Fabrique une pastille de dé (texte et/ou symbole), avec un libellé pour les lecteurs d'écran.
function chip(texte: string | null, libelle: string, classes: string, glyph?: GlyphName): HTMLElement {
  const el = document.createElement('span'); // la pastille
  el.className = `chip ${classes}`.trim(); // style
  el.setAttribute('role', 'img'); // c'est une image pour les lecteurs d'écran
  el.setAttribute('aria-label', libelle); // sa description
  if (glyph) el.appendChild(glyphSvg(glyph)); // symbole éventuel
  if (texte !== null) el.appendChild(document.createTextNode(texte)); // texte éventuel (jamais de HTML)
  return el; // pastille prête
}

// Classe de couleur d'un niveau.
function niveauClasse(o: Outcome): 'ok' | 'bad' | 'great' {
  if (!o.success) return 'bad'; // échec
  return o.runes > 0 ? 'great' : 'ok'; // réussite avec rune = grande
}

// Affiche la carte de résultat.
function renderResult(o: Outcome | null): void {
  const box = byId('result'); // la carte
  box.replaceChildren(); // la vide
  if (!o) {
    box.className = 'result'; // style neutre
    const p = document.createElement('p'); // message
    p.className = 'result-empty'; // style
    p.textContent = "Aucun jet pour l'instant. Touche « Lancer » !"; // état vide : dit quoi faire
    box.appendChild(p); // ajoute
    return;
  }
  box.className = `result ${niveauClasse(o)}`; // couleur selon le niveau
  const titre = document.createElement('h3'); // niveau
  titre.className = 'result-title'; // style
  titre.textContent = VOCAB.levels[o.level]; // ex. « Grande réussite »
  const ligne = document.createElement('p'); // total
  ligne.className = 'result-line'; // style
  ligne.textContent = `Total ${o.total} · SR ${o.targetNumber}`; // total et seuil
  const pastilles = document.createElement('div'); // détail des dés
  pastilles.className = 'chips'; // style
  o.featFaces.forEach((f: FeatFace, i) => {
    const garde = i === o.keptIndex; // dé retenu ?
    const classes = `feat${garde ? '' : ' dropped'}${f === 'eye' ? ' eye' : ''}`; // style : écarté = estompé
    if (f === 'eye') pastilles.appendChild(chip(null, `${VOCAB.featDie} : ${VOCAB.eye}${garde ? '' : ' (écarté)'}`, classes, 'eye')); // œil
    else if (f === 'gandalf') pastilles.appendChild(chip(null, `${VOCAB.featDie} : ${VOCAB.gandalf}${garde ? '' : ' (écarté)'}`, classes, 'gandalf')); // rune de Gandalf
    else pastilles.appendChild(chip(String(f), `${VOCAB.featDie} : ${f}${garde ? '' : ' (écarté)'}`, classes)); // nombre
  });
  for (const d of o.successDice) {
    const libelle = `dé de Maîtrise : ${d.face}${d.rune ? ' (rune)' : ''}${d.ignored ? ', ignoré (Épuisé)' : ''}`; // description
    pastilles.appendChild(chip(String(d.face), libelle, d.ignored ? 'ignored' : '', d.rune ? 'rune' : undefined)); // dé de Maîtrise
  }
  const notes = document.createElement('div'); // remarques
  notes.className = 'result-notes'; // style
  const note = (t: string) => {
    const p = document.createElement('p'); // une remarque
    p.textContent = t; // texte
    notes.appendChild(p); // ajoute
  };
  if (o.gandalf) note(`${VOCAB.gandalf} : réussite automatique.`); // Gandalf
  if (o.eye) note(o.autoFail ? `${VOCAB.eye} avec l'état ${VOCAB.miserable} : échec automatique.` : `${VOCAB.eye} : le GL en tire les conséquences.`); // Œil
  if (o.success && o.runes > 0) note(`${o.runes} ${VOCAB.rune}${o.runes > 1 ? 's' : ''} sur les dés de Maîtrise.`); // runes
  box.append(titre, ligne, pastilles, notes); // assemble la carte
}

// Dessine l'historique avec des séparateurs de jour.
function renderHistory(): void {
  const liste = byId('history-list'); // la liste
  liste.replaceChildren(); // la vide
  byId('history-empty').hidden = history.length > 0; // état vide visible seulement sans jets
  let dernierJour = ''; // dernier libellé de jour affiché
  const maintenant = Date.now(); // référence pour « Aujourd'hui »
  for (const e of history) {
    const jour = dayLabel(e.ts, maintenant); // libellé du jour de ce jet
    if (jour !== dernierJour) {
      const sep = document.createElement('li'); // séparateur
      sep.className = 'day-sep'; // style
      const pastille = document.createElement('span'); // pastille de date
      pastille.textContent = jour; // texte du jour
      sep.appendChild(pastille); // assemble
      liste.appendChild(sep); // ajoute
      dernierJour = jour; // mémorise
    }
    liste.appendChild(historyItem(e)); // le jet lui-même
  }
}

// Fabrique la ligne d'un jet. Les actions secondaires apparaissent au toucher.
function historyItem(e: HistoryEntry): HTMLElement {
  const li = document.createElement('li'); // ligne
  li.className = 'hist-item'; // style
  const main = document.createElement('button'); // zone touchable
  main.type = 'button'; // pas un bouton de formulaire
  main.className = 'hist-main'; // style
  main.setAttribute('aria-expanded', 'false'); // actions repliées
  const heure = document.createElement('span'); // heure
  heure.className = 'hist-time'; // style
  heure.textContent = timeLabel(e.ts); // ex. 21:05
  const niveau = document.createElement('span'); // niveau
  niveau.className = `hist-level ${niveauClasse(e.outcome)}`; // couleur
  niveau.textContent = VOCAB.levels[e.outcome.level]; // ex. « Échec »
  const detail = document.createElement('span'); // détail
  detail.className = 'hist-detail'; // style
  detail.textContent = `${e.outcome.total} / SR ${e.outcome.targetNumber}`; // total et seuil
  main.append(heure, niveau, detail); // assemble
  const actions = document.createElement('div'); // actions secondaires
  actions.className = 'hist-actions'; // style
  actions.hidden = true; // cachées tant qu'on ne touche pas
  const reprendre = document.createElement('button'); // reprendre les réglages
  reprendre.type = 'button'; // bouton simple
  reprendre.className = 'btn'; // style
  reprendre.textContent = 'Reprendre ces réglages'; // libellé
  reprendre.addEventListener('click', () => {
    change(e.input); // remet les réglages de ce jet
    showToast('Réglages repris.', 'ok'); // retour
  });
  const retirer = document.createElement('button'); // retirer le jet
  retirer.type = 'button'; // bouton simple
  retirer.className = 'btn'; // style
  retirer.textContent = 'Retirer'; // libellé
  retirer.addEventListener('click', () => {
    history = history.filter((h) => h.id !== e.id); // enlève ce jet
    saveJson('history', history); // mémorise
    renderHistory(); // redessine
  });
  actions.append(reprendre, retirer); // assemble
  main.addEventListener('click', () => {
    const ouvrir = actions.hidden; // doit-on déplier ?
    for (const a of all<HTMLElement>('.hist-actions')) a.hidden = true; // referme les autres
    for (const m of all<HTMLElement>('.hist-main')) m.setAttribute('aria-expanded', 'false'); // état des autres
    actions.hidden = !ouvrir; // déplie ou replie celui-ci
    main.setAttribute('aria-expanded', String(ouvrir)); // état pour les lecteurs d'écran
  });
  li.append(main, actions); // assemble la ligne
  return li; // ligne prête
}

// Identifiant unique d'un jet.
function newId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`; // date + nombre aléatoire
}

// Lance les dés. Si un lancer est en cours, un toucher le termine tout de suite.
function doRoll(): void {
  closeOmen(); // un nouveau lancer ferme le présage en cours
  if (stage?.isRolling()) {
    stage.finish(true); // un appui pendant le lancer : les dés sautent à l'arrivée, le son s'arrête
    return;
  }
  const reglages = normalizeInput(input); // réglages propres
  const raw = rollRaw(reglages, cryptoRng); // 1. LE TIRAGE : fait ici, par le hasard cryptographique
  const outcome = evaluate(reglages, raw); // 2. L'interprétation selon les règles
  const faces: FeatFace[] = [...raw.featFaces, ...raw.successFaces]; // faces à montrer, dans l'ordre des dés
  const reduits = [...raw.featFaces.map((_, i) => raw.featFaces.length > 1 && i !== outcome.keptIndex), ...raw.successFaces.map(() => false)]; // dé du Destin écarté : réduit
  const fletris = [...raw.featFaces.map(() => false), ...outcome.successDice.map((d) => d.ignored)]; // dés de Maîtrise annulés par l'état Épuisé : ils se flétrissent
  const btn = byId('btn-roll'); // bouton Lancer
  btn.setAttribute('aria-busy', 'true'); // occupé pendant l'animation
  const terminer = () => {
    btn.removeAttribute('aria-busy'); // libre à nouveau
    renderResult(outcome); // 3. LE RÉSULTAT s'affiche à l'arrivée des dés
    history = [{ id: newId(), ts: Date.now(), input: reglages, outcome }, ...history].slice(0, HISTORY_MAX); // ajoute à l'historique
    if (!saveJson('history', history)) showToast("Impossible de sauvegarder l'historique sur cet appareil.", 'error'); // prévient si le stockage est bloqué
    renderHistory(); // redessine
    const scenes: Scene[] = []; // scènes à jouer, dans l'ordre
    if (outcome.eye || outcome.gandalf) scenes.push({ kind: outcome.eye ? 'eye' : 'gandalf' }); // présage : seulement pour le dé du Destin gardé
    const tier = tauTier(outcome.runes, outcome.success); // fête des runes de réussite : 1 sympa, 2 grandiose, 3 épique
    if (tier > 0) scenes.push({ kind: 'tau', tier, n: tauShown(outcome.runes) }); // après le présage s'il y en a un
    playOmens(scenes, soundEnabled(), matchMedia('(prefers-reduced-motion: reduce)').matches); // joue (rien si la liste est vide)
  };
  if (stage) stage.roll({ kinds: kindsFor(reglages), faces, reduits, fletris, sound: soundEnabled(), onDone: terminer }); // 4. L'ANIMATION 3D plein écran, qui atterrit sur les faces tirées
  else terminer(); // sans 3D : résultat immédiat
}

// Prépare la scène 3D une fois la police des chiffres chargée (les dés l'utilisent pour écrire leurs faces).
async function startStage(): Promise<void> {
  try {
    await Promise.race([document.fonts.load('600 100px "Source Sans 3"'), new Promise((r) => setTimeout(r, 1500))]); // attend la police (1,5 s au plus)
    stage = DiceStage.create(byId<HTMLCanvasElement>('dice-canvas')); // crée la scène plein écran
    if (!stage) {
      byId('stage-fallback').hidden = false; // explique que la 3D est indisponible
      return;
    }
    stage.warmUp(); // prépare la 3D pour que le premier lancer soit fluide
  } catch (e) {
    console.warn('Scène 3D non démarrée :', e); // trace pour le dépannage
    byId('stage-fallback').hidden = false; // l'app reste utilisable sans 3D
  }
}

// Branche l'écran.
export function initRoller(): void {
  input = sanitizeRollInput(loadJson('roll')); // derniers réglages
  initPrefs(() => stage?.refreshColors()); // couleur des dés et son (applique la couleur avant la création de la 3D)
  history = sanitizeHistory(loadJson('history')); // historique mémorisé
  for (const b of all<HTMLButtonElement>('[data-step]')) {
    b.addEventListener('click', () => {
      const dir = Number(b.dataset.dir); // −1 ou +1
      if (b.dataset.step === 'pool') change({ pool: input.pool + dir }); // dés de Maîtrise
      else change({ targetNumber: input.targetNumber + dir }); // SR
    });
  }
  for (const r of all<HTMLInputElement>('input[name="mode"]')) r.addEventListener('change', () => change({ mode: r.value as RollInput['mode'] })); // mode du dé du Destin
  byId('chk-weary').addEventListener('change', (e) => change({ weary: (e.target as HTMLInputElement).checked })); // Épuisé
  byId('chk-miserable').addEventListener('change', (e) => change({ miserable: (e.target as HTMLInputElement).checked })); // Mélancolique
  byId('btn-roll').addEventListener('click', doRoll); // bouton Lancer
  byId('dice-canvas').addEventListener('click', doRoll); // pendant le lancer, le calque plein écran capte l'appui : il termine le lancer
  byId('btn-clear').addEventListener('click', () => {
    if (history.length === 0) {
      showToast("L'historique est déjà vide."); // rien à faire
      return;
    }
    history = []; // vide
    saveJson('history', history); // mémorise
    renderHistory(); // redessine
    showToast('Historique effacé.', 'ok'); // retour
  });
  syncUI(); // affichage initial des réglages
  renderHistory(); // affichage initial de l'historique
  renderResult(history[0]?.outcome ?? null); // rappelle le dernier résultat (ou l'état vide)
  void startStage(); // la 3D démarre sans bloquer le reste
}
