// Scène 3D des dés (Three.js). Principe : le résultat est TIRÉ AU SORT ailleurs (src/rules), cette scène ne fait que
// l'ANIMER : les dés roulent environ 1 seconde puis s'immobilisent exactement sur les faces tirées.
import {
  AmbientLight, BoxGeometry, DirectionalLight, DodecahedronGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Matrix4, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, SRGBColorSpace, CanvasTexture, Vector3, WebGLRenderer,
  type BufferGeometry,
} from 'three'; // briques de la 3D
import type { FeatFace } from '../rules/tor'; // faces du dé du Destin
import { readPalette, type DicePalette } from './colors'; // couleurs lues dans le CSS
import { CUBE_VALUES, cubeFaces, dodecaFaces, featValuesForFaces, type FaceInfo } from './faces'; // faces des dés
import { makeLabelTexture } from './labels'; // étiquettes des faces
import { layoutDice, type DieKind } from './layout'; // disposition des dés
import { quaternionForFace } from './orientation'; // orientation d'atterrissage

// Durée d'un lancer, en millisecondes (environ 1 seconde).
const DUREE_MS = 1000;
// Décalage entre deux dés pour que le lancer paraisse naturel.
const DECALAGE_MS = 25;
// Face montrée par un dé au repos avant le premier lancer.
const FACE_REPOS: Record<DieKind, FeatFace> = { feat: 10, success: 5 };

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
  kind: DieKind; // type de dé
  tpl: Template; // modèle utilisé
  group: Group; // objet 3D du dé
  shadow: Mesh; // ombre portée sous le dé
  size: number; // échelle de ce dé (plus petit s'il est écarté)
  rest: Vector3; // position finale (posé sur la table)
  start: Vector3; // position de départ du lancer
  axis: Vector3; // axe de rotation de la roulade
  turns: number; // nombre de tours de la roulade
  finalQuat: Quaternion; // orientation finale
  delay: number; // retard de départ
  duration: number; // durée du lancer de ce dé
}

// Constante utilitaire : copie d'un nombre entre deux bornes.
const borner = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class DiceStage {
  private renderer: WebGLRenderer; // moteur de rendu
  private scene = new Scene(); // scène
  private camera = new PerspectiveCamera(32, 1, 0.1, 100); // caméra
  private palette: DicePalette; // couleurs courantes
  private templates!: Record<DieKind, Template>; // modèles des deux types de dés
  private dice: DieView[] = []; // dés affichés
  private kinds: DieKind[] = []; // types demandés
  private shrink: boolean[] = []; // dés à réduire (dé du Destin écarté)
  private shown: FeatFace[] = []; // faces actuellement montrées
  private shadowTex: CanvasTexture; // texture de l'ombre
  private shadowGeo = new PlaneGeometry(1, 1); // plan de l'ombre
  private labelGeoCache = new Map<number, PlaneGeometry>(); // plans d'étiquette selon la taille
  private rolling = false; // un lancer est en cours
  private t0 = 0; // instant de départ du lancer
  private raf = 0; // identifiant de l'animation en cours
  private onDone: (() => void) | null = null; // appelé à l'arrivée des dés
  private largeur = 3; // largeur occupée par les dés
  private observer: ResizeObserver; // surveille la taille de la zone
  private mouvementReduit: MediaQueryList; // préférence « réduire les animations »

  // Crée la scène, ou rend null si le navigateur ne sait pas faire de 3D.
  static create(canvas: HTMLCanvasElement, host: HTMLElement): DiceStage | null {
    try {
      return new DiceStage(canvas, host); // tente de créer la scène
    } catch (e) {
      console.warn('3D indisponible :', e); // garde une trace pour le dépannage
      return null; // l'app continue sans 3D
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    private host: HTMLElement,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true }); // peut échouer sans WebGL
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // netteté sans surcharge
    this.renderer.setClearColor(0x000000, 0); // fond transparent : on voit la table du CSS
    this.mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)'); // préférence de l'appareil
    this.camera.up.set(0, 0, -1); // le haut de l'écran correspond à -Z sur la table
    this.scene.add(new AmbientLight(0xffffff, 1.15)); // lumière douce partout
    const soleil = new DirectionalLight(0xffffff, 2.1); // lumière directionnelle
    soleil.position.set(-4, 9, 5); // vient du haut-gauche, côté joueur
    this.scene.add(soleil); // ajoute à la scène
    this.shadowGeo.rotateX(-Math.PI / 2); // l'ombre est couchée sur la table
    this.shadowTex = this.makeShadowTexture(); // texture d'ombre floue
    this.palette = readPalette(); // couleurs actuelles
    this.templates = { feat: this.buildTemplate('feat'), success: this.buildTemplate('success') }; // modèles de dés
    this.observer = new ResizeObserver(() => this.resize()); // réagit aux changements de taille
    this.observer.observe(host); // surveille la zone
    this.canvas.addEventListener('webglcontextrestored', () => this.render()); // redessine si le navigateur rend le contexte
    this.resize(); // première mise à la taille
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
    const scale = feat ? 1 : 1.3; // échelle (le cube est agrandi pour avoir une taille voisine)
    return {
      body, // forme
      edges: new EdgesGeometry(body, 15), // arêtes visibles
      bodyMat: new MeshStandardMaterial({ color: feat ? p.featBody : p.succBody, roughness: 0.5, metalness: 0.12, flatShading: true }), // corps mat
      edgeMat: new LineBasicMaterial({ color: p.edge }), // arêtes
      faces, // faces
      values, // valeurs
      labels: new Map(), // matières d'étiquette (créées à la demande)
      scale, // échelle
      restY: faces[0].center.length() * scale, // hauteur du centre posé sur une face
      labelSize: feat ? 0.62 : 0.72, // taille de l'étiquette
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

  // Construit un dé à partir de son modèle.
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
    return { kind, tpl, group, shadow, size, rest: new Vector3(), start: new Vector3(), axis: new Vector3(0, 1, 0), turns: 0, finalQuat: new Quaternion(), delay: 0, duration: DUREE_MS }; // état initial
  }

  // Orientation qui montre la valeur demandée vers le haut.
  private quatFor(die: DieView, value: FeatFace, yaw: number): Quaternion {
    const i = Math.max(0, die.tpl.values.findIndex((v) => v === value)); // face portant cette valeur
    const f = die.tpl.faces[i]; // la face
    return quaternionForFace(f.normal, f.up, yaw); // orientation correspondante
  }

  // Remplace les dés affichés : kinds = type de chaque dé, reduit = dés à réduire.
  setDice(kinds: DieKind[], reduit: boolean[] = []): void {
    this.finish(); // termine un éventuel lancer en cours
    this.clearDice(); // retire les anciens dés
    this.kinds = kinds; // mémorise
    this.shrink = kinds.map((_, i) => reduit[i] === true); // dés à réduire
    this.shown = kinds.map((k) => FACE_REPOS[k]); // faces de repos
    this.dice = kinds.map((k, i) => this.createDie(k, this.shrink[i])); // crée les dés
    this.applyLayout(); // les range
    this.restPose(); // les pose au repos
    this.render(); // dessine
  }

  // Retire les dés de la scène (les modèles partagés restent).
  private clearDice(): void {
    for (const d of this.dice) {
      this.scene.remove(d.group, d.shadow); // retire de la scène
      (d.shadow.material as MeshBasicMaterial).dispose(); // libère la matière de l'ombre
    }
    this.dice = []; // plus de dés
  }

  // Range les dés selon la forme de la zone et ajuste la caméra.
  private applyLayout(): void {
    const w = Math.max(1, this.host.clientWidth); // largeur de la zone
    const h = Math.max(1, this.host.clientHeight); // hauteur de la zone
    const { placements, width, depth } = layoutDice(this.kinds, w / h); // disposition
    this.largeur = width; // mémorise la largeur occupée (sert à placer le départ des dés hors du cadre)
    this.dice.forEach((d, i) => d.rest.set(placements[i].x, d.tpl.restY * (d.size / d.tpl.scale), placements[i].z)); // position posée de chaque dé
    const fov = (this.camera.fov * Math.PI) / 180; // champ de vision en radians
    const besoin = Math.max((depth + 1) / 2, (width + 1) / (2 * this.camera.aspect)); // demi-taille à faire entrer dans l'image
    const dist = besoin / Math.tan(fov / 2); // distance de la caméra
    this.camera.position.set(0, dist, dist * 0.22); // caméra au-dessus, légèrement inclinée vers le joueur
    this.camera.lookAt(0, 0, 0); // regarde le centre de la table
    this.camera.updateProjectionMatrix(); // applique
  }

  // Pose chaque dé à sa place finale, montrant la face mémorisée.
  private restPose(): void {
    this.dice.forEach((d, i) => {
      d.group.position.copy(d.rest); // position posée
      d.group.quaternion.copy(this.quatFor(d, this.shown[i], 0)); // face voulue vers le haut
      this.placeShadow(d, d.rest.x, d.rest.z, 0); // ombre sous le dé
    });
  }

  // Place l'ombre sous un dé ; plus le dé est haut, plus l'ombre est large et pâle.
  private placeShadow(d: DieView, x: number, z: number, hauteur: number): void {
    d.shadow.position.set(x, 0.02, z); // juste au-dessus de la table
    const s = d.size * (2.3 + hauteur * 0.5); // largeur de l'ombre
    d.shadow.scale.set(s, 1, s); // applique
    (d.shadow.material as MeshBasicMaterial).opacity = 0.55 / (1 + hauteur * 1.2); // pâlit en s'éloignant
  }

  // Lance l'animation vers les faces données (une par dé, dans l'ordre de setDice). onDone est appelé à l'arrivée.
  // reduit : dés à réduire (le dé du Destin écarté quand on est favorisé ou défavorisé).
  roll(faces: FeatFace[], onDone: () => void, reduit: boolean[] = []): void {
    this.finish(); // termine un lancer précédent
    this.shown = this.kinds.map((_, i) => faces[i] ?? FACE_REPOS[this.kinds[i]]); // faces finales
    this.shrink = this.kinds.map((_, i) => reduit[i] === true); // dés à réduire
    this.dice.forEach((d, i) => {
      d.size = d.tpl.scale * (this.shrink[i] ? 0.8 : 1); // nouvelle échelle du dé
      d.group.scale.setScalar(d.size); // applique l'échelle
      d.rest.y = d.tpl.restY * (d.size / d.tpl.scale); // le dé réduit se pose plus bas
    });
    if (this.mouvementReduit.matches) {
      this.restPose(); // pas d'animation si l'appareil réduit les animations
      this.render(); // dessine l'état final
      onDone(); // prévient immédiatement
      return;
    }
    this.dice.forEach((d, i) => {
      d.finalQuat.copy(this.quatFor(d, this.shown[i], (Math.random() - 0.5) * 0.8)); // orientation finale avec un petit lacet
      d.start.set(d.rest.x - this.largeur / 2 - 4 - Math.random() * 2, 4 + Math.random() * 1.5, d.rest.z + 3 + Math.random() * 2); // départ en haut à gauche, côté joueur
      d.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); // axe de roulade aléatoire
      d.turns = 2 + Math.random() * 1.5; // entre 2 et 3,5 tours
      d.delay = i * DECALAGE_MS; // départs échelonnés
      d.duration = DUREE_MS - 80 + Math.random() * 160; // durées légèrement différentes
    });
    this.rolling = true; // lancer en cours
    this.onDone = onDone; // mémorise le rappel
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
    if (fini) this.finish(); // tout le monde est arrivé
    else this.raf = requestAnimationFrame((n) => this.tick(n)); // image suivante
  }

  // Positionne un dé à l'avancement t (0 = départ, 1 = arrivé).
  private pose(d: DieView, t: number): void {
    const e = 1 - Math.pow(1 - t, 3); // ralentit vers la fin
    const rebond = Math.abs(Math.sin(t * Math.PI * 2.4)) * Math.pow(1 - t, 1.6) * 1.8; // rebonds qui s'amortissent
    const x = d.start.x + (d.rest.x - d.start.x) * e; // position horizontale
    const z = d.start.z + (d.rest.z - d.start.z) * e; // position verticale (profondeur)
    const y = d.rest.y + rebond + (d.start.y - d.rest.y) * Math.pow(1 - e, 2); // hauteur : chute puis rebonds
    d.group.position.set(x, y, z); // applique la position
    const spin = new Quaternion().setFromAxisAngle(d.axis, (1 - e) * d.turns * Math.PI * 2); // roulade qui s'arrête
    d.group.quaternion.copy(spin.multiply(d.finalQuat)); // roulade + orientation finale (identiques à t = 1)
    this.placeShadow(d, x, z, y - d.rest.y); // ombre
  }

  // Termine immédiatement le lancer en cours : les dés sautent à leur place finale.
  finish(): void {
    if (!this.rolling) return; // rien à terminer
    cancelAnimationFrame(this.raf); // arrête l'animation
    this.rolling = false; // plus de lancer
    for (const d of this.dice) this.pose(d, 1); // tous à l'arrivée
    this.render(); // dessine l'état final
    const cb = this.onDone; // récupère le rappel
    this.onDone = null; // un seul appel
    cb?.(); // prévient l'appelant
  }

  // Un lancer est-il en cours ?
  isRolling(): boolean {
    return this.rolling; // état courant
  }

  // Relit les couleurs du CSS (après un changement de teinte) et reconstruit les dés.
  refreshColors(): void {
    this.finish(); // termine un éventuel lancer
    this.disposeTemplates(); // libère les anciens modèles
    this.palette = readPalette(); // nouvelles couleurs
    this.templates = { feat: this.buildTemplate('feat'), success: this.buildTemplate('success') }; // nouveaux modèles
    const faces = [...this.shown]; // mémorise les faces montrées
    this.clearDice(); // retire les dés
    this.dice = this.kinds.map((k, i) => this.createDie(k, this.shrink[i])); // recrée
    this.shown = faces; // remet les faces
    this.applyLayout(); // range
    this.restPose(); // pose
    this.render(); // dessine
  }

  // Adapte la scène à la taille de la zone.
  resize(): void {
    const w = Math.max(1, this.host.clientWidth); // largeur
    const h = Math.max(1, this.host.clientHeight); // hauteur
    this.renderer.setSize(w, h, false); // taille du canevas (le CSS gère l'affichage)
    this.camera.aspect = w / h; // proportions de la caméra
    this.applyLayout(); // nouvelle disposition
    if (!this.rolling) this.restPose(); // replace les dés posés
    this.render(); // dessine
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
    this.observer.disconnect(); // stoppe la surveillance de taille
    this.clearDice(); // retire les dés
    this.disposeTemplates(); // libère les modèles
    for (const g of this.labelGeoCache.values()) g.dispose(); // libère les plans d'étiquette
    this.shadowGeo.dispose(); // plan d'ombre
    this.shadowTex.dispose(); // texture d'ombre
    this.renderer.dispose(); // moteur de rendu
  }
}
