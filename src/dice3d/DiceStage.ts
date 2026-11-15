// Scène 3D des dés (Three.js), dessinée sur TOUT l'écran, par-dessus l'app.
// Principe : le résultat est TIRÉ AU SORT ailleurs (src/rules). Cette scène ne fait que l'ANIMER : les dés arrivent du bas de l'écran,
// rebondissent sur les bords et s'immobilisent exactement sur les faces tirées. Quelques secondes après, ils s'effacent en fondu.
import {
  AmbientLight, BoxGeometry, DirectionalLight, DodecahedronGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Matrix4, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, SRGBColorSpace, CanvasTexture, Vector3, WebGLRenderer,
  type BufferGeometry,
} from 'three'; // briques de la 3D
import { startDiceSound, stopDiceSound, type SoundEvent } from '../audio/diceSound'; // sons
import type { FeatFace } from '../rules/tor'; // faces du dé du Destin
import { readPalette, type DicePalette } from './colors'; // couleurs lues dans le CSS
import { CUBE_VALUES, cubeFaces, dodecaFaces, featValuesForFaces, type FaceInfo } from './faces'; // faces des dés
import { makeLabelTexture } from './labels'; // étiquettes des faces
import { scatterDice, type DieKind } from './layout'; // répartition des dés posés
import { quaternionForFace } from './orientation'; // orientation d'atterrissage
import { easeOut, flightPosition, impactEvents, planFlight, type Flight, type Walls } from './trajectory'; // trajectoires

// Durée d'un lancer, en millisecondes (environ 1 seconde).
const DUREE_MS = 1100;
// Décalage entre deux dés pour que le lancer paraisse naturel.
const DECALAGE_MS = 25;
// Durée pendant laquelle les dés restent visibles une fois posés, puis durée du fondu.
const MAINTIEN_MS = 3000;
const FONDU_MS = 600;
// Champ de vision de la caméra, en degrés.
const CHAMP = 32;
// Retrait des dés posés par rapport aux bords : la perspective grossit un peu les dés qui se trouvent près du bord.
const RETRAIT = 0.45;
// Hauteur approximative du dessus d'un dé posé (sert à corriger l'effet de perspective sur les bords).
const HAUTEUR_DES = 1.7;
// Distance entre le centre d'un dé et le mur au moment du choc.
const MARGE_MUR = 0.9;
// Taille des dés à l'écran : une « unité » de la scène vaut entre 38 et 72 pixels (selon le plus petit côté de l'écran).
const PX_MIN = 38;
const PX_MAX = 72;
const PX_DIVISEUR = 7;

// Modèle partagé par tous les dés d'un même type (géométrie, matières, faces).
interface Template {
  body: BufferGeometry; // forme du dé
  edges: BufferGeometry; // arêtes
  bodyMat: MeshStandardMaterial; // matière du corps
  edgeMat: LineBasicMaterial; // matière des arêtes
  faces: FaceInfo[]; // faces
  values: FeatFace[]; // valeur écrite sur chaque face
  labels: Map<string, MeshBasicMaterial>; // matière d'étiquette par valeur
  scale: number; // échelle du dé
  restY: number; // hauteur du centre quand le dé est posé
  labelSize: number; // côté de l'étiquette
}

// Un dé affiché.
interface DieView {
  tpl: Template; // modèle utilisé
  group: Group; // objet 3D du dé
  shadow: Mesh; // ombre portée sous le dé
  size: number; // échelle de ce dé (plus petit s'il est écarté)
  restY: number; // hauteur du centre quand le dé est posé
  flight: Flight; // trajectoire (départ, rebonds, arrivée)
  startY: number; // hauteur de départ
  axis: Vector3; // axe de rotation de la roulade
  turns: number; // nombre de tours de la roulade
  finalQuat: Quaternion; // orientation finale
  delay: number; // retard de départ
  duration: number; // durée du lancer de ce dé
}

// Ce qu'il faut pour lancer les dés.
export interface RollSpec {
  kinds: DieKind[]; // type de chaque dé
  faces: FeatFace[]; // face tirée de chaque dé (le tirage est fait AVANT, ailleurs)
  reduits: boolean[]; // dés à réduire (le dé du Destin écarté quand on est favorisé ou défavorisé)
  sound: boolean; // jouer les sons ?
  onDone: () => void; // appelé à l'arrivée des dés
}

// Constante utilitaire : ramène un nombre entre deux bornes.
const borner = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
// Nombre aléatoire entre a et b (pour l'allure du lancer ; jamais pour le résultat).
const entre = (a: number, b: number) => a + Math.random() * (b - a);

export class DiceStage {
  private renderer: WebGLRenderer; // moteur de rendu
  private scene = new Scene(); // scène
  private camera = new PerspectiveCamera(CHAMP, 1, 0.1, 200); // caméra
  private palette: DicePalette; // couleurs courantes
  private templates!: Record<DieKind, Template>; // modèles des deux types de dés
  private dice: DieView[] = []; // dés affichés
  private shown: FeatFace[] = []; // faces finales
  private shadowTex: CanvasTexture; // texture de l'ombre
  private shadowGeo = new PlaneGeometry(1, 1); // plan de l'ombre
  private labelGeoCache = new Map<number, PlaneGeometry>(); // plans d'étiquette selon la taille
  private rolling = false; // un lancer est en cours
  private t0 = 0; // instant de départ du lancer
  private raf = 0; // identifiant de l'animation en cours
  private onDone: (() => void) | null = null; // appelé à l'arrivée des dés
  private halfW = 3; // demi-largeur visible de la table (unités de la scène)
  private halfH = 6; // demi-hauteur visible de la table
  private grossi = 1.1; // grossissement de la perspective pour un dé posé (les dés près du bord paraissent repoussés vers l'extérieur)
  private walls: Walls = { x: 2, top: 5 }; // murs contre lesquels les dés rebondissent
  private lastW = 0; // largeur de l'écran à la dernière mesure
  private lastH = 0; // hauteur de l'écran à la dernière mesure
  private holdTimer = 0; // minuteur « les dés restent visibles »
  private fadeTimer = 0; // minuteur « fondu terminé »
  private observer: ResizeObserver; // surveille la taille de l'écran
  private mouvementReduit: MediaQueryList; // préférence « réduire les animations »

  // Crée la scène, ou rend null si le navigateur ne sait pas faire de 3D.
  static create(canvas: HTMLCanvasElement): DiceStage | null {
    try {
      return new DiceStage(canvas); // tente de créer la scène
    } catch (e) {
      console.warn('3D indisponible :', e); // garde une trace pour le dépannage
      return null; // l'app continue sans 3D
    }
  }

  private constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true }); // peut échouer sans WebGL
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // netteté sans surcharge
    this.renderer.setClearColor(0x000000, 0); // fond transparent : on voit l'app derrière les dés
    this.mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)'); // préférence de l'appareil
    this.camera.up.set(0, 0, -1); // le haut de l'écran correspond à -Z sur la table
    this.scene.add(new AmbientLight(0xffffff, 1.2)); // lumière douce partout
    const soleil = new DirectionalLight(0xffffff, 2.2); // lumière directionnelle
    soleil.position.set(-4, 9, 5); // vient du haut-gauche, côté joueur
    this.scene.add(soleil); // ajoute à la scène
    this.shadowGeo.rotateX(-Math.PI / 2); // l'ombre est couchée sur la table
    this.shadowTex = this.makeShadowTexture(); // texture d'ombre floue
    this.palette = readPalette(); // couleurs actuelles
    this.templates = { feat: this.buildTemplate('feat'), success: this.buildTemplate('success') }; // modèles de dés
    this.observer = new ResizeObserver(() => this.onResize()); // réagit aux changements de taille (rotation du téléphone…)
    this.observer.observe(canvas); // surveille l'écran
    this.canvas.addEventListener('webglcontextrestored', () => this.render()); // redessine si le navigateur rend le contexte
  }

  // Ombre : disque noir flou, dessiné une fois.
  private makeShadowTexture(): CanvasTexture {
    const c = document.createElement('canvas'); // canevas jetable
    c.width = c.height = 128; // petite image suffisante
    const ctx = c.getContext('2d')!; // contexte 2D
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62); // dégradé du centre vers le bord
    g.addColorStop(0, 'rgba(0,0,0,0.85)'); // centre sombre
    g.addColorStop(1, 'rgba(0,0,0,0)'); // bord transparent
    ctx.fillStyle = g; // utilise le dégradé
    ctx.fillRect(0, 0, 128, 128); // peint toute l'image
    const t = new CanvasTexture(c); // texture
    t.colorSpace = SRGBColorSpace; // couleurs correctes
    return t; // texture prête
  }

  // Fabrique le modèle d'un type de dé.
  private buildTemplate(kind: DieKind): Template {
    const p = this.palette; // couleurs
    const feat = kind === 'feat'; // dé du Destin ?
    const body = feat ? new DodecahedronGeometry(1, 0) : new BoxGeometry(1, 1, 1); // d12 ou cube
    const faces = feat ? dodecaFaces() : cubeFaces(); // faces
    const values: FeatFace[] = feat ? featValuesForFaces(faces) : CUBE_VALUES; // valeurs des faces
    const scale = feat ? 1 : 1.5; // échelle (le cube est agrandi pour avoir une taille voisine du d12)
    return {
      body, // forme
      edges: new EdgesGeometry(body, 15), // arêtes visibles
      bodyMat: new MeshStandardMaterial({ color: p.body, roughness: 0.38, metalness: 0.05, flatShading: true }), // corps lisse
      edgeMat: new LineBasicMaterial({ color: p.edge }), // arêtes
      faces, // faces
      values, // valeurs
      labels: new Map(), // matières d'étiquette (créées à la demande)
      scale, // échelle
      restY: faces[0].center.length() * scale, // hauteur du centre posé sur une face
      labelSize: feat ? 0.98 : 0.96, // étiquette presque aussi grande que la face
    };
  }

  // Matière d'étiquette pour une valeur (créée une fois puis réutilisée).
  private labelMaterial(tpl: Template, kind: DieKind, value: FeatFace): MeshBasicMaterial {
    const k = String(value); // clé de la valeur
    let m = tpl.labels.get(k); // déjà créée ?
    if (!m) {
      m = new MeshBasicMaterial({ map: makeLabelTexture(kind, value, this.palette), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); // étiquette transparente
      tpl.labels.set(k, m); // on la garde
    }
    return m; // matière prête
  }

  // Plan d'étiquette de la bonne taille (partagé).
  private labelGeo(size: number): PlaneGeometry {
    let g = this.labelGeoCache.get(size); // déjà créé ?
    if (!g) {
      g = new PlaneGeometry(size, size); // carré de la taille voulue
      this.labelGeoCache.set(size, g); // on le garde
    }
    return g; // plan prêt
  }

  // Construit un dé à partir de son modèle et l'ajoute à la scène.
  private createDie(kind: DieKind, reduit: boolean): DieView {
    const tpl = this.templates[kind]; // modèle
    const group = new Group(); // objet 3D du dé
    group.add(new Mesh(tpl.body, tpl.bodyMat)); // corps
    group.add(new LineSegments(tpl.edges, tpl.edgeMat)); // arêtes
    tpl.faces.forEach((f, i) => {
      const etiquette = new Mesh(this.labelGeo(tpl.labelSize), this.labelMaterial(tpl, kind, tpl.values[i])); // étiquette de la face
      etiquette.position.copy(f.center).addScaledVector(f.normal, 0.004); // posée juste au-dessus de la face
      const droite = new Vector3().crossVectors(f.up, f.normal).normalize(); // axe droit du texte
      etiquette.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(droite, f.up, f.normal)); // orientée comme la face
      group.add(etiquette); // ajoute au dé
    });
    const size = tpl.scale * (reduit ? 0.8 : 1); // échelle de ce dé
    group.scale.setScalar(size); // applique l'échelle
    const shadow = new Mesh(this.shadowGeo, new MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, opacity: 0.55 })); // ombre
    this.scene.add(group, shadow); // ajoute à la scène
    return {
      tpl, group, shadow, size, restY: tpl.restY * (size / tpl.scale), // le dé réduit se pose plus bas
      flight: { start: { x: 0, z: 0 }, virtual: { x: 0, z: 0 }, rest: { x: 0, z: 0 } }, // trajectoire provisoire
      startY: 5, axis: new Vector3(0, 1, 0), turns: 0, finalQuat: new Quaternion(), delay: 0, duration: DUREE_MS, // état initial
    };
  }

  // Orientation qui montre la valeur demandée vers le haut.
  private quatFor(die: DieView, value: FeatFace, yaw: number): Quaternion {
    const i = Math.max(0, die.tpl.values.findIndex((v) => v === value)); // face portant cette valeur
    const f = die.tpl.faces[i]; // la face
    return quaternionForFace(f.normal, f.up, yaw); // orientation correspondante
  }

  // Mesure l'écran et règle la caméra : vue de dessus, taille des dés à peu près constante en pixels.
  private measure(): void {
    const w = Math.max(1, this.canvas.clientWidth); // largeur de l'écran
    const h = Math.max(1, this.canvas.clientHeight); // hauteur de l'écran
    this.lastW = w; // mémorise pour repérer un changement de taille
    this.lastH = h;
    this.renderer.setSize(w, h, false); // taille du canevas (le CSS gère l'affichage)
    const unite = borner(Math.min(w, h) / PX_DIVISEUR, PX_MIN, PX_MAX); // pixels par unité de la scène
    this.halfW = w / 2 / unite; // demi-largeur de la table visible
    this.halfH = h / 2 / unite; // demi-hauteur de la table visible
    const dist = this.halfH / Math.tan((CHAMP * Math.PI) / 360); // distance qui fait entrer exactement la hauteur de l'écran
    this.camera.aspect = w / h; // proportions de la caméra
    this.camera.position.set(0, dist, 0); // caméra au-dessus du centre
    this.camera.lookAt(0, 0, 0); // regarde droit vers le bas
    this.camera.updateProjectionMatrix(); // applique
    this.grossi = dist / (dist - HAUTEUR_DES); // la perspective agrandit ce qui est au-dessus de la table, donc le repousse vers les bords
    this.walls = { x: Math.max(0.3, this.halfW / this.grossi - MARGE_MUR), top: Math.max(0.3, this.halfH / this.grossi - MARGE_MUR) }; // murs un peu en retrait des bords
  }

  // L'écran change de taille (rotation…) : les dés affichés n'auraient plus la bonne place, on les retire.
  private onResize(): void {
    if (this.canvas.hidden) return; // rien d'affiché : la prochaine mesure se fera au prochain lancer
    if (this.canvas.clientWidth === this.lastW && this.canvas.clientHeight === this.lastH) return; // même taille : rien à faire
    this.finish(true); // termine un éventuel lancer
    this.dismissNow(); // retire les dés
  }

  // Prépare la 3D à l'avance (compile les matières) pour éviter un à-coup au premier lancer.
  warmUp(): void {
    try {
      this.measure(); // règle la caméra
      this.dice = [this.createDie('feat', false), this.createDie('success', false)]; // un dé de chaque type
      this.renderer.compile(this.scene, this.camera); // compile les matières
      this.render(); // un premier rendu charge les textures
    } catch (e) {
      console.warn('Préchauffage 3D ignoré :', e); // sans gravité
    } finally {
      this.clearDice(); // retire les dés de préchauffage
    }
  }

  // Lance les dés. Le résultat (spec.faces) est déjà tiré : l'animation y atterrit exactement.
  roll(spec: RollSpec): void {
    this.finish(true); // termine un lancer précédent
    this.dismissNow(); // retire les dés encore affichés
    this.canvas.hidden = false; // montre le calque plein écran
    this.measure(); // taille de l'écran et caméra (après l'affichage, pour avoir la vraie taille)
    this.dice = spec.kinds.map((k, i) => this.createDie(k, spec.reduits[i] === true)); // crée les dés
    this.shown = spec.kinds.map((_, i) => spec.faces[i] ?? 1); // faces finales
    const places = scatterDice(spec.kinds, this.halfW / this.grossi - RETRAIT, this.halfH / this.grossi - RETRAIT, Math.random); // où chaque dé se posera
    const evenements: SoundEvent[] = []; // chocs à jouer
    this.dice.forEach((d, i) => {
      d.flight = planFlight(places[i], this.walls, this.halfH + 3, Math.random); // trajectoire : arrive du bas, rebondit sur les bords
      d.startY = d.restY + entre(4, 5.5); // hauteur de départ
      d.finalQuat.copy(this.quatFor(d, this.shown[i], entre(-0.4, 0.4))); // orientation finale avec un petit lacet
      d.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); // axe de roulade aléatoire
      d.turns = entre(2, 3.5); // entre 2 et 3,5 tours
      d.delay = i * DECALAGE_MS; // départs échelonnés
      d.duration = DUREE_MS - 100 + Math.random() * 200; // durées légèrement différentes
      for (const e of impactEvents(d.flight, this.walls)) evenements.push({ at: (d.delay + e.t * d.duration) / 1000, strength: e.strength, kind: e.kind }); // chocs de ce dé
    });
    this.onDone = spec.onDone; // mémorise le rappel
    if (this.mouvementReduit.matches) {
      this.dice.forEach((d) => this.pose(d, 1)); // pas d'animation si l'appareil réduit les animations : les dés apparaissent posés
      this.render(); // dessine l'état final
      if (spec.sound) startDiceSound([{ at: 0, strength: 0.5, kind: 'floor' }], 0.2, 1); // un seul « toc »
      this.endRoll(); // termine tout de suite
      return;
    }
    this.dice.forEach((d) => this.pose(d, 0)); // place les dés au départ avant le premier dessin
    if (spec.sound) startDiceSound(evenements, (DUREE_MS + 100) / 1000, this.dice.length); // sons du lancer
    this.rolling = true; // lancer en cours
    this.canvas.classList.add('rolling'); // le calque capte les appuis (un appui termine le lancer)
    this.t0 = performance.now(); // instant de départ
    this.raf = requestAnimationFrame((t) => this.tick(t)); // lance l'animation
  }

  // Une image de l'animation.
  private tick(now: number): void {
    let fini = true; // tous les dés sont-ils arrivés ?
    for (const d of this.dice) {
      const t = borner((now - this.t0 - d.delay) / d.duration, 0, 1); // avancement de ce dé de 0 à 1
      if (t < 1) fini = false; // au moins un dé roule encore
      this.pose(d, t); // positionne le dé
    }
    this.render(); // dessine
    if (fini) this.finish(false); // tout le monde est arrivé : les sons vont jusqu'au bout
    else this.raf = requestAnimationFrame((n) => this.tick(n)); // image suivante
  }

  // Positionne un dé à l'avancement t (0 = départ, 1 = arrivé).
  private pose(d: DieView, t: number): void {
    const e = easeOut(t); // avancement du trajet (rapide puis lent)
    const p = flightPosition(d.flight, e, this.walls); // position au sol, repliée sur les murs
    const rebond = Math.abs(Math.sin(t * Math.PI * 2.4)) * Math.pow(1 - t, 1.6) * 1.8; // rebonds qui s'amortissent
    const y = d.restY + rebond + (d.startY - d.restY) * Math.pow(1 - e, 2); // hauteur : chute puis rebonds
    d.group.position.set(p.x, y, p.z); // applique la position
    const spin = new Quaternion().setFromAxisAngle(d.axis, (1 - e) * d.turns * Math.PI * 2); // roulade qui s'arrête
    d.group.quaternion.copy(spin.multiply(d.finalQuat)); // roulade + orientation finale (identiques à t = 1)
    this.placeShadow(d, p.x, p.z, y - d.restY); // ombre
  }

  // Place l'ombre sous un dé ; plus le dé est haut, plus l'ombre est large et pâle.
  private placeShadow(d: DieView, x: number, z: number, hauteur: number): void {
    d.shadow.position.set(x, 0.02, z); // juste au-dessus de la table
    const s = d.size * (2.3 + hauteur * 0.5); // largeur de l'ombre
    d.shadow.scale.set(s, 1, s); // applique
    (d.shadow.material as MeshBasicMaterial).opacity = 0.55 / (1 + hauteur * 1.2); // pâlit en s'éloignant
  }

  // Termine immédiatement le lancer en cours : les dés sautent à leur place finale. coupeSon = true si l'utilisateur a interrompu.
  finish(coupeSon: boolean): void {
    if (!this.rolling) return; // rien à terminer
    cancelAnimationFrame(this.raf); // arrête l'animation
    this.rolling = false; // plus de lancer
    if (coupeSon) stopDiceSound(); // un appui coupe le son (à l'arrivée naturelle, on laisse finir le dernier « toc »)
    for (const d of this.dice) this.pose(d, 1); // tous à l'arrivée
    this.render(); // dessine l'état final
    this.endRoll(); // prévient et programme l'effacement
  }

  // Fin d'un lancer : rend les appuis à l'app, prévient l'appelant, programme l'effacement des dés.
  private endRoll(): void {
    this.canvas.classList.remove('rolling'); // le calque laisse de nouveau passer les appuis
    const cb = this.onDone; // récupère le rappel
    this.onDone = null; // un seul appel
    this.holdTimer = window.setTimeout(() => this.fadeOut(), MAINTIEN_MS); // les dés restent visibles un moment
    cb?.(); // prévient l'appelant
  }

  // Efface les dés en fondu.
  private fadeOut(): void {
    this.canvas.classList.add('fading'); // le CSS fait le fondu
    this.fadeTimer = window.setTimeout(() => this.dismissNow(), FONDU_MS + 50); // puis on retire tout
  }

  // Retire tout de suite les dés et cache le calque.
  dismissNow(): void {
    window.clearTimeout(this.holdTimer); // annule les minuteurs
    window.clearTimeout(this.fadeTimer);
    this.clearDice(); // retire les dés
    this.canvas.classList.remove('fading', 'rolling'); // état de base
    this.canvas.hidden = true; // cache le calque : plus aucun coût
  }

  // Un lancer est-il en cours ?
  isRolling(): boolean {
    return this.rolling; // état courant
  }

  // Applique de nouvelles couleurs (dés noirs ou blancs) : relit le CSS et reconstruit les modèles.
  refreshColors(): void {
    this.finish(true); // termine un éventuel lancer
    this.dismissNow(); // retire les dés
    this.disposeTemplates(); // libère les anciens modèles
    this.palette = readPalette(); // nouvelles couleurs
    this.templates = { feat: this.buildTemplate('feat'), success: this.buildTemplate('success') }; // nouveaux modèles
  }

  // Retire les dés de la scène (les modèles partagés restent).
  private clearDice(): void {
    for (const d of this.dice) {
      this.scene.remove(d.group, d.shadow); // retire de la scène
      (d.shadow.material as MeshBasicMaterial).dispose(); // libère la matière de l'ombre
    }
    this.dice = []; // plus de dés
  }

  // Dessine la scène.
  private render(): void {
    this.renderer.render(this.scene, this.camera); // un rendu
  }

  // Libère les ressources des modèles.
  private disposeTemplates(): void {
    for (const t of Object.values(this.templates)) {
      t.body.dispose(); // forme
      t.edges.dispose(); // arêtes
      t.bodyMat.dispose(); // matière du corps
      t.edgeMat.dispose(); // matière des arêtes
      for (const m of t.labels.values()) {
        m.map?.dispose(); // texture
        m.dispose(); // matière
      }
    }
  }

  // Libère tout (si l'écran est détruit).
  dispose(): void {
    cancelAnimationFrame(this.raf); // stoppe l'animation
    window.clearTimeout(this.holdTimer); // annule les minuteurs
    window.clearTimeout(this.fadeTimer);
    stopDiceSound(); // coupe le son
    this.observer.disconnect(); // stoppe la surveillance de taille
    this.clearDice(); // retire les dés
    this.disposeTemplates(); // libère les modèles
    for (const g of this.labelGeoCache.values()) g.dispose(); // libère les plans d'étiquette
    this.shadowGeo.dispose(); // plan d'ombre
    this.shadowTex.dispose(); // texture d'ombre
    this.renderer.dispose(); // moteur de rendu
  }
}
