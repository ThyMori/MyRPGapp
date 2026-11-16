// Programmes graphiques (GLSL) des présages. Un seul rectangle plein écran ; chaque pixel est calculé par la carte graphique :
// forme, feu, lumière, braises, étincelles, vignettage. Aucune image n'est utilisée.

// Sommet : un rectangle qui couvre tout l'écran.
export const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Outils communs : précision, bruit, couches de bruit (fbm), braises, rampe de feu.
const COMMUN = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;   // taille du canvas en pixels
uniform float uT;    // temps en secondes
uniform float uFade; // opacité d'ensemble
uniform float uOct;  // couches de bruit (3 à 5)

float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uOct) break;
    v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5;
  }
  return v;
}
// Particules qui montent (braises, étincelles) : trois couches de profondeur.
vec3 particules(vec2 p, float t, vec3 coul, float densite, float vitesse) {
  vec3 c = vec3(0.0);
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float sc = 7.0 + fl * 6.0;
    vec2 q = p * sc;
    q.y -= t * vitesse * (0.8 + fl * 0.5);
    q.x += sin(t * 0.7 + fl * 3.0 + q.y * 0.5) * 0.35;
    vec2 id = floor(q); vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 17.0);
    vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
    float d = length(f - off);
    float scint = 0.5 + 0.5 * sin(t * 7.0 + h * 40.0);
    c += coul * step(h, densite) * smoothstep(0.1, 0.0, d) * scint * (1.0 - fl * 0.25);
  }
  return c;
}
// Rampe de feu : braise sombre, rouge, orange, jaune pâle.
vec3 feu(float x) {
  x = clamp(x, 0.0, 1.0);
  vec3 a = vec3(0.22, 0.0, 0.0); vec3 b = vec3(0.95, 0.18, 0.02); vec3 c = vec3(1.0, 0.6, 0.1); vec3 d = vec3(1.0, 0.92, 0.55);
  return x < 0.4 ? mix(a, b, x / 0.4) : (x < 0.75 ? mix(b, c, (x - 0.4) / 0.35) : mix(c, d, (x - 0.75) / 0.25));
}
// Sortie : adoucit les très fortes lumières, puis prépare la couleur « prémultipliée » (le fond reste visible à travers).
vec4 sortie(vec3 col, float sombre) {
  col = 1.0 - exp(-col * 1.35);
  float a = clamp(sombre + max(col.r, max(col.g, col.b)), 0.0, 1.0) * uFade;
  return vec4(min(col * uFade, vec3(a)), a);
}
`;

// L'Œil de Sauron : amande de feu, iris en flammes, pupille en fente, couronne de flammes, rayons, braises, tremblement.
export const EYE_FRAG = COMMUN + `
uniform float uOpen; uniform float uPupilX; uniform float uDilate; uniform float uPulse; uniform float uShake; uniform float uFlash;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  p += uShake * 0.014 * vec2(sin(uT * 91.0), cos(uT * 77.0));
  float S = min(ar * 0.46, 0.55) / 0.8;
  vec2 q = p / S;
  float W = 0.8;
  float r0 = length(q);
  // Forme de l'œil (amande) : demi-hauteur selon la position horizontale, un peu plus haute au-dessus.
  float arche = pow(clamp(1.0 - (q.x / W) * (q.x / W), 0.0, 1.0), 0.9);
  float h = 0.36 * arche * uOpen * (q.y > 0.0 ? 1.0 : 0.85) * (1.0 + 0.05 * uPulse);
  float d = abs(q.y) - h;
  float dedans = smoothstep(0.012, -0.012, d) * step(abs(q.x), W);
  // Blanc de l'œil : orangé au centre, sombre vers les paupières, veinures.
  float bord = smoothstep(-0.26, 0.0, d);
  float veines = pow(fbm(q * vec2(6.0, 9.0) + vec2(0.0, uT * 0.3)), 3.0);
  vec3 sclera = mix(vec3(1.0, 0.34, 0.06) * 0.95, vec3(0.1, 0.0, 0.0), bord) + vec3(0.5, 0.0, 0.0) * veines * (1.0 - bord);
  // Iris : flammes qui montent, chaud au centre.
  vec2 ic = vec2(uPupilX, 0.0);
  float r = length(q - ic);
  float irisR = 0.31;
  float dansIris = smoothstep(irisR + 0.012, irisR - 0.012, r);
  float n = fbm(q * 7.0 + vec2(uT * 0.3, -uT * 1.6));
  float chaud = smoothstep(irisR, 0.0, r);
  vec3 iris = feu(chaud * 1.25 + (n - 0.5) * 0.8) * 1.2;
  iris *= 1.0 - 0.55 * smoothstep(irisR - 0.07, irisR, r);
  // Pupille : fente verticale qui s'élargit, liseré brûlant.
  vec2 pp = q - ic;
  float larg = (0.034 + 0.05 * uDilate + 0.012 * uPulse) * pow(max(1.0 - (pp.y / 0.35) * (pp.y / 0.35), 0.0), 0.7);
  float sd = abs(pp.x) - larg;
  float pupille = smoothstep(0.007, -0.007, sd) * step(abs(pp.y), 0.35);
  vec3 oeil = mix(sclera, iris, dansIris);
  oeil += vec3(1.0, 0.5, 0.1) * smoothstep(0.035, 0.0, abs(sd)) * step(abs(pp.y), 0.33) * 0.9;
  oeil = mix(oeil, vec3(0.0), pupille);
  oeil *= 1.0 + 0.35 * uPulse;
  // Couronne de flammes autour des paupières.
  float dx = max(abs(q.x) - W, 0.0);
  float dy = max(abs(q.y) - h, 0.0) * (q.y > 0.0 ? 0.55 : 1.1);
  float d2 = length(vec2(dx, dy));
  float nf = fbm(vec2(q.x * 3.4, q.y * 2.8 - uT * 2.4) + vec2(0.0, 3.0));
  float flamme = smoothstep(0.0, 0.9, nf * 1.5 - d2 * 2.6) * exp(-d2 * 3.4);
  vec3 col = feu(0.25 + flamme * 0.95) * flamme * 0.85 * smoothstep(0.0, 0.6, uOpen);
  col += vec3(1.0, 0.25, 0.04) * exp(-d2 * 5.0) * 0.3 * uOpen;
  // Rayons qui partent de l'œil.
  float rays = pow(fbm(normalize(q + 1e-4) * 3.0 + uT * 0.12), 3.0) * exp(-r0 * 1.3) * 0.55 * uOpen;
  col += vec3(1.0, 0.33, 0.08) * rays;
  // Halo général, braises, éclair du cor.
  col += vec3(0.45, 0.04, 0.01) * exp(-r0 * 1.5) * (0.4 + 0.5 * uOpen);
  col += particules(q * 0.9, uT, vec3(1.4, 0.55, 0.14), 0.16, 0.55) * uOpen;
  col += vec3(1.0, 0.5, 0.2) * uFlash * 0.55 * exp(-r0 * 1.8);
  // L'œil par-dessus, avec son éclat.
  col = mix(col, oeil, dedans);
  col += vec3(1.0, 0.45, 0.1) * dedans * dansIris * chaud * 0.35;
  float sombre = 0.66 + 0.25 * smoothstep(0.2, 1.4, r0);
  gl_FragColor = sortie(col, sombre);
}
`;

// Le bâton de Gandalf : bois noueux éclairé par le cristal, cristal rayonnant, onde de lumière, poussière d'étoiles.
export const GANDALF_FRAG = COMMUN + `
uniform float uRise; uniform float uIgnite; uniform float uFlash; uniform float uRing;
void main() {
  vec2 q = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 oc = vec2(0.0, 0.17 + (uRise - 1.0) * 0.12);
  vec2 v = q - oc;
  float r = length(v);
  float ang = atan(v.y, v.x);
  float ign = uIgnite * (1.0 + 0.12 * sin(uT * 9.0) + uFlash * 1.6);
  vec3 col = vec3(0.0);
  // Brume bleue lumineuse autour du cristal.
  col += vec3(0.1, 0.32, 0.95) * fbm(q * 2.6 + vec2(0.0, -uT * 0.25)) * exp(-r * 1.5) * ign * 0.6;
  col += vec3(0.02, 0.05, 0.22) * exp(-length(q) * 1.1) * (0.4 + 0.6 * uRise);
  // Bâton : bois veiné, plus clair près du cristal.
  float cx = 0.02 * sin(q.y * 5.0 + 0.8) - 0.012;
  float dist = abs(q.x - cx);
  float larg = 0.008 + 0.006 * smoothstep(-0.6, 0.1, q.y) + 0.004 * smoothstep(0.05, 0.0, abs(fract(q.y * 5.0) - 0.5) - 0.44);
  float bois = smoothstep(larg + 0.003, larg - 0.003, dist) * step(q.y, oc.y - 0.045) * step(-0.62, q.y) * uRise;
  float grain = fbm(vec2(q.x * 90.0, q.y * 9.0));
  float eclaire = exp(-length(q - oc) * 5.5) * uIgnite;
  vec3 coulBois = vec3(0.42, 0.29, 0.17) * (0.5 + grain * 0.8) * (0.18 + eclaire * 1.5) + vec3(0.15, 0.4, 1.0) * eclaire * 0.5;
  // Fourche autour du cristal : anneau ouvert vers le haut.
  float dAnneau = abs(r - 0.088) - 0.011;
  float fourche = smoothstep(0.003, -0.003, dAnneau) * step(v.y, 0.03) * uRise;
  col = mix(col, coulBois, max(bois, fourche));
  // Cristal : cœur blanc, bords bleus, facettes qui scintillent.
  float bille = smoothstep(0.053, 0.047, r) * uIgnite;
  vec3 coeur = mix(vec3(0.35, 0.65, 1.0), vec3(1.0), exp(-r * 38.0));
  coeur += vec3(0.4, 0.7, 1.0) * (fbm(v * 70.0 + uT * 2.0) - 0.4) * 0.6;
  col = mix(col, coeur * 1.6, bille);
  // Halos, étoile à rayons, traînées de lumière.
  col += vec3(0.2, 0.5, 1.0) * exp(-r * 10.0) * ign * 1.3;
  col += vec3(0.5, 0.8, 1.0) * exp(-r * 30.0) * ign * 1.1;
  float etoile = pow(abs(cos(ang * 6.0 + uT * 0.35)), 44.0) * exp(-r * 5.0) + 0.7 * pow(abs(cos(ang * 4.0 - uT * 0.5)), 34.0) * exp(-r * 8.0);
  col += vec3(0.55, 0.82, 1.0) * etoile * ign * 0.85;
  float trainee = exp(-abs(v.y) * 70.0) * exp(-abs(v.x) * 3.2) + exp(-abs(v.x) * 70.0) * exp(-abs(v.y) * 3.4);
  col += vec3(0.5, 0.78, 1.0) * trainee * ign * 0.45;
  // Onde de lumière qui s'étend depuis le cristal, deux fois.
  if (uRing >= 0.0) {
    float r1 = (r - uRing * 0.95) * 38.0;
    float r2 = (r - (uRing - 0.22) * 0.95) * 38.0;
    col += vec3(0.45, 0.8, 1.0) * (exp(-r1 * r1) * exp(-uRing * 1.8) + 0.6 * step(0.0, uRing - 0.22) * exp(-r2 * r2) * exp(-(uRing - 0.22) * 1.8)) * 1.5;
  }
  // Poussière d'étoiles : plus dense près du cristal.
  col += particules(q * 0.95, uT, vec3(0.7, 0.9, 1.9), 0.16 + 0.3 * exp(-r * 1.6), 0.35) * uIgnite;
  col += vec3(0.6, 0.85, 1.0) * uFlash * 0.5 * exp(-r * 2.0);
  float sombre = 0.62 + 0.28 * smoothstep(0.2, 1.2, length(q));
  gl_FragColor = sortie(col, sombre);
}
`;

// La fête des runes de réussite : des tau d'or qui surgissent. Niveau 1 : éclat discret ; 2 : ondes et rayons ; 3 : épique
// (rayons, colonne de lumière, lignes de vitesse, pluie d'étincelles, éclairs, tremblements).
export const TAU_FRAG = COMMUN + `
uniform float uTier; uniform float uN; uniform float uShake; uniform float uFlash;
// Distance à un segment.
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// Le tau (lettre grecque) : barre en haut, jambage central qui se recourbe en bas à droite. Rend la distance au tracé (négatif = dedans).
float tau(vec2 p) {
  float d = seg(p, vec2(-0.23, 0.15), vec2(0.23, 0.15));
  d = min(d, seg(p, vec2(0.0, 0.15), vec2(0.0, -0.13)));
  d = min(d, seg(p, vec2(0.0, -0.13), vec2(0.035, -0.19)));
  d = min(d, seg(p, vec2(0.035, -0.19), vec2(0.11, -0.215)));
  return d - 0.032;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  p += uShake * 0.016 * vec2(sin(uT * 97.0), cos(uT * 83.0));
  float S = min(0.42, 0.98 * ar / (max(uN, 1.0) * 0.56));
  vec2 q = p / S;
  float rq = length(q);
  float ang = atan(q.y, q.x);
  float epique = step(2.5, uTier);
  float grand = step(1.5, uTier);
  vec3 col = vec3(0.0);
  // Fond doré qui respire.
  col += vec3(0.5, 0.27, 0.04) * exp(-length(p) * 2.2) * 0.6;
  // Rayons dorés qui tournent autour du centre (niveaux 2 et 3).
  float rayons = pow(abs(cos(ang * 9.0 + uT * 0.5)), 14.0) * exp(-length(p) * 1.5);
  col += vec3(1.0, 0.72, 0.2) * rayons * (0.28 * grand + 0.32 * epique);
  // Épique : colonne de lumière qui monte du centre, lignes de vitesse, éclair de fond.
  col += vec3(1.0, 0.8, 0.35) * epique * exp(-abs(p.x) * 9.0) * (0.4 + 0.3 * sin(uT * 8.0 + p.y * 6.0)) * 0.6;
  float vit = fbm(vec2(ang * 11.0, length(p) * 2.0 - uT * 5.0));
  col += vec3(1.0, 0.7, 0.25) * epique * pow(vit, 3.0) * smoothstep(0.2, 0.9, length(p)) * 0.9;
  col += vec3(1.0, 0.85, 0.5) * uFlash * 0.4 * (0.5 + exp(-length(p) * 2.0));
  // Les tau, l'un après l'autre.
  float pitch = 0.56;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uN) break;
    float lt = uT - (0.2 + float(i) * 0.28);
    if (lt < 0.0) continue;
    float k = smoothstep(0.0, 0.28, lt);
    float s = 0.25 + 0.75 * k + 0.22 * sin(k * 3.14159);
    vec2 c = vec2((float(i) - (uN - 1.0) * 0.5) * pitch, 0.0);
    vec2 pp = (q - c) / s;
    float d = tau(pp);
    float dedans = smoothstep(0.012, -0.012, d);
    // Or métallique : dégradé, reflet qui balaie la lettre, liseré clair.
    vec3 or = mix(vec3(0.62, 0.36, 0.04), vec3(1.0, 0.82, 0.35), smoothstep(-0.25, 0.25, pp.y + 0.15 * sin(pp.x * 6.0)));
    float reflet = smoothstep(0.1, 0.0, abs(pp.x * 0.8 + pp.y * 0.6 - (fract(lt * 0.7) * 2.2 - 1.1) * 0.5));
    or += vec3(1.0, 0.95, 0.75) * reflet * 0.45 + vec3(1.0, 0.9, 0.6) * smoothstep(-0.03, 0.0, d) * 0.3;
    col += vec3(1.0, 0.62, 0.1) * exp(-max(d, 0.0) * 14.0) * 0.45 * k + vec3(1.0, 0.7, 0.2) * exp(-length(pp) * 2.4) * 0.2 * k;
    col = mix(col, or * 1.05, dedans * k);
    // Onde de lumière à l'arrivée de chaque tau (niveaux 2 et 3), double en épique.
    float r = length(q - c);
    float o1 = (r - lt * 1.3) * 22.0;
    float o2 = (r - (lt - 0.18) * 1.3) * 22.0;
    col += vec3(1.0, 0.8, 0.35) * grand * (exp(-o1 * o1) * exp(-lt * 1.6) + epique * step(0.0, lt - 0.18) * exp(-o2 * o2) * exp(-(lt - 0.18) * 1.6)) * 0.9;
  }
  // Étincelles d'or : de plus en plus nombreuses selon le niveau.
  col += particules(q * 0.55, uT, vec3(1.7, 1.1, 0.35), 0.1 + 0.18 * uTier + 0.25 * epique, 0.6 + 0.5 * uTier);
  // Épique : traînée de lumière horizontale qui s'ouvre à chaque coup fort.
  col += vec3(1.0, 0.85, 0.5) * epique * exp(-abs(p.y) * 38.0) * exp(-abs(p.x) * 1.4) * uFlash * 1.2;
  float sombre = 0.58 + 0.3 * smoothstep(0.2, 1.1, length(p));
  gl_FragColor = sortie(col, sombre);
}
`;
