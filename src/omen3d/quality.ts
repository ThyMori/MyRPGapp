// Niveau de qualité des effets des présages. Fonctions pures : choix de la résolution et baisse automatique si l'appareil rame.

// Réglage de l'utilisateur : élevé, réduit, ou « simple » (dessins plats sans effets 3D).
export type Fx = 'high' | 'low' | 'off';

// Remet en ordre le réglage lu dans le stockage : élevé par défaut.
export function sanitizeFx(raw: unknown): Fx {
  return raw === 'low' || raw === 'off' ? raw : 'high'; // seules valeurs reconnues autres que « high »
}

// Réglage suivant (pour le bouton du menu qui fait défiler).
export function nextFx(f: Fx): Fx {
  return f === 'high' ? 'low' : f === 'low' ? 'off' : 'high'; // high → low → off → high
}

// Réglage de rendu : échelle de la résolution (1 = pixels de l'écran) et nombre de couches de bruit.
export interface Quality {
  scale: number; // fraction de la résolution de l'écran
  oct: number; // couches de bruit (plus = plus fin et plus lourd)
}

// Qualité de départ pour un réglage et une densité de pixels de l'écran.
export function startQuality(fx: Fx, dpr: number): Quality {
  const d = Math.min(Math.max(dpr, 1), 2); // densité bornée
  return fx === 'low' ? { scale: 0.6, oct: 3 } : { scale: Math.min(d, 1.5), oct: 5 }; // réduit : peu de pixels ; élevé : jusqu'à 1,5×
}

// Baisse la qualité si le temps moyen d'une image dépasse 30 ms (moins de ~33 images/s). Rend null si on ne peut plus baisser.
export function lower(q: Quality, avgMs: number): Quality | null {
  if (avgMs <= 30) return null; // assez fluide : on ne touche à rien
  if (q.scale <= 0.5 && q.oct <= 3) return null; // déjà au plus bas
  return { scale: Math.max(0.5, q.scale * 0.7), oct: 3 }; // moins de pixels, moins de couches
}
