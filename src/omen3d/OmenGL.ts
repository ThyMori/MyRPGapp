// Moteur d'affichage des présages : un canvas WebGL plein écran qui joue le programme graphique de l'Œil ou du bâton.
// Pas de bibliothèque : un rectangle, deux programmes, des « uniforms » mis à jour à chaque image d'après timeline.ts.
import { EYE_FRAG, GANDALF_FRAG, VERTEX } from './shaders'; // programmes graphiques
import { lower, startQuality, type Fx, type Quality } from './quality'; // niveau de qualité
import { DUREE_S, eyeState, gandalfState } from './timeline'; // chronologie

export type OmenGlKind = 'eye' | 'gandalf'; // les deux scènes

// Un programme compilé avec ses emplacements de variables.
interface Prog {
  prog: WebGLProgram; // le programme
  loc: Record<string, WebGLUniformLocation | null>; // emplacements des uniforms
}

export class OmenGL {
  private gl: WebGLRenderingContext; // contexte de dessin
  private progs: Partial<Record<OmenGlKind, Prog>> = {}; // programmes compilés à la demande
  private raf = 0; // identifiant de l'image programmée
  private perdu = false; // contexte perdu : on ne dessine plus
  private qualite: Quality = { scale: 1, oct: 5 }; // qualité courante
  private t0 = 0; // instant de départ
  private dts: number[] = []; // durées des premières images (pour la baisse automatique)
  private derniere = 0; // instant de la dernière image

  private constructor(private canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.gl = gl; // mémorise le contexte
    const buf = gl.createBuffer(); // tampon du rectangle
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); // le sélectionne
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); // deux triangles plein écran
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); // on gère nous-mêmes
      this.perdu = true; // plus de dessin
    });
  }

  // Crée le moteur, ou rend null si WebGL n'est pas disponible (l'appelant utilise alors les dessins plats).
  static create(canvas: HTMLCanvasElement): OmenGL | null {
    try {
      const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); // contexte transparent
      return gl ? new OmenGL(canvas, gl) : null; // null si indisponible
    } catch {
      return null; // erreur : pas de 3D
    }
  }

  // Compile un programme (null en cas d'échec).
  private compiler(kind: OmenGlKind): Prog | null {
    const gl = this.gl; // raccourci
    const cache = this.progs[kind]; // déjà compilé ?
    if (cache) return cache; // oui
    const sh = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type); // crée
      if (!s) return null; // échec
      gl.shaderSource(s, src); // source
      gl.compileShader(s); // compile
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; // null si erreur de compilation
    };
    const vs = sh(gl.VERTEX_SHADER, VERTEX); // sommet
    const fs = sh(gl.FRAGMENT_SHADER, kind === 'eye' ? EYE_FRAG : GANDALF_FRAG); // pixels
    if (!vs || !fs) return null; // échec
    const prog = gl.createProgram(); // programme
    if (!prog) return null; // échec
    gl.attachShader(prog, vs); // attache
    gl.attachShader(prog, fs); // attache
    gl.bindAttribLocation(prog, 0, 'aPos'); // position en emplacement 0
    gl.linkProgram(prog); // assemble
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null; // échec
    const noms = ['uRes', 'uT', 'uFade', 'uOct', 'uOpen', 'uPupilX', 'uDilate', 'uPulse', 'uShake', 'uFlash', 'uRise', 'uIgnite', 'uRing']; // variables possibles
    const loc: Record<string, WebGLUniformLocation | null> = {}; // emplacements
    for (const n of noms) loc[n] = gl.getUniformLocation(prog, n); // cherche chacun (null si absent du programme)
    return (this.progs[kind] = { prog, loc }); // mémorise
  }

  // Ajuste la taille du canvas à l'écran et à la qualité.
  private redimensionner(): void {
    const w = Math.max(1, Math.round(this.canvas.clientWidth * this.qualite.scale)); // largeur en pixels
    const h = Math.max(1, Math.round(this.canvas.clientHeight * this.qualite.scale)); // hauteur en pixels
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; // applique
      this.canvas.height = h;
    }
  }

  // Lance une scène. Rend false si elle ne peut pas être dessinée (l'appelant se rabat sur les dessins plats).
  start(kind: OmenGlKind, fx: Fx): boolean {
    this.stop(); // une seule scène à la fois
    if (this.perdu || fx === 'off') return false; // pas de 3D
    const p = this.compiler(kind); // programme
    if (!p) return false; // compilation impossible
    this.qualite = startQuality(fx, window.devicePixelRatio || 1); // qualité de départ
    this.dts = []; // repart de zéro
    this.t0 = performance.now(); // instant de départ
    this.derniere = this.t0; // dernière image
    const gl = this.gl; // raccourci
    gl.useProgram(p.prog); // programme actif
    gl.enableVertexAttribArray(0); // attribut de position
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); // lit les sommets du tampon
    gl.disable(gl.DEPTH_TEST); // pas de profondeur
    const image = (now: number) => {
      if (this.perdu) return; // contexte perdu : on s'arrête
      const t = Math.min((now - this.t0) / 1000, DUREE_S); // temps de la scène
      this.surveiller(now); // baisse la qualité si ça rame
      this.redimensionner(); // taille du canvas
      gl.viewport(0, 0, this.canvas.width, this.canvas.height); // zone de dessin
      gl.clearColor(0, 0, 0, 0); // fond transparent
      gl.clear(gl.COLOR_BUFFER_BIT); // efface
      const L = p.loc; // emplacements
      gl.uniform2f(L.uRes, this.canvas.width, this.canvas.height); // taille
      gl.uniform1f(L.uT, t); // temps
      gl.uniform1f(L.uOct, this.qualite.oct); // couches de bruit
      if (kind === 'eye') {
        const s = eyeState(t); // état de l'Œil à cet instant
        gl.uniform1f(L.uFade, s.fade); // opacité
        gl.uniform1f(L.uOpen, s.open); // paupières
        gl.uniform1f(L.uPupilX, s.pupilX); // regard
        gl.uniform1f(L.uDilate, s.dilate); // pupille
        gl.uniform1f(L.uPulse, s.pulse); // battement
        gl.uniform1f(L.uShake, s.shake); // tremblement
        gl.uniform1f(L.uFlash, s.flash); // éclair
      } else {
        const s = gandalfState(t); // état du bâton à cet instant
        gl.uniform1f(L.uFade, s.fade); // opacité
        gl.uniform1f(L.uRise, s.rise); // montée
        gl.uniform1f(L.uIgnite, s.ignite); // allumage
        gl.uniform1f(L.uFlash, s.flash); // éclat
        gl.uniform1f(L.uRing, s.ring); // onde
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // dessine le rectangle
      if (t < DUREE_S) this.raf = requestAnimationFrame(image); // image suivante
    };
    this.raf = requestAnimationFrame(image); // première image
    return true; // la scène tourne
  }

  // Mesure le temps des 12 premières images ; si c'est trop lent, baisse la qualité une fois.
  private surveiller(now: number): void {
    if (this.dts.length >= 12) return; // mesure déjà faite
    this.dts.push(now - this.derniere); // durée de l'image
    this.derniere = now; // mémorise
    if (this.dts.length === 12) {
      const moy = this.dts.slice(2).reduce((a, b) => a + b, 0) / 10; // moyenne sans les deux premières (démarrage)
      const q = lower(this.qualite, moy); // baisse nécessaire ?
      if (q) this.qualite = q; // oui : applique
    }
  }

  // Arrête la scène et efface le canvas.
  stop(): void {
    cancelAnimationFrame(this.raf); // annule l'image programmée
    this.raf = 0; // plus d'image
    if (!this.perdu) {
      this.gl.clearColor(0, 0, 0, 0); // fond transparent
      this.gl.clear(this.gl.COLOR_BUFFER_BIT); // efface
    }
  }
}
