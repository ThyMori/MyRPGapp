// Base commune des sons : un seul contexte audio pour toute l'app, et un bruit blanc partagé.

let ctx: AudioContext | null = null; // contexte audio (créé au premier son, qui suit un geste de l'utilisateur)
let bruit: AudioBuffer | null = null; // une seconde de bruit blanc, réutilisée

// Rend le contexte audio, créé et réveillé si besoin. Rend null si l'appareil ne sait pas faire de son.
export function audioContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; // anciens Safari
      if (!Ctor) return null; // pas d'audio sur cet appareil
      ctx = new Ctor(); // crée le contexte
    }
    if (ctx.state === 'suspended') void ctx.resume(); // les navigateurs le suspendent tant qu'on n'a pas touché l'écran
    return ctx; // contexte prêt
  } catch {
    return null; // le son est facultatif : on continue sans
  }
}

// Bruit blanc d'une seconde (créé une fois).
export function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!bruit) {
    bruit = c.createBuffer(1, c.sampleRate, c.sampleRate); // une seconde, un canal
    const d = bruit.getChannelData(0); // les échantillons
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; // du hasard entre -1 et 1
  }
  return bruit; // tampon prêt
}

// Coupe en douceur un volume (30 ms, pour éviter un « clic ») puis le débranche.
export function fadeOutAndDisconnect(c: AudioContext, g: GainNode): void {
  try {
    g.gain.cancelScheduledValues(c.currentTime); // annule les changements de volume prévus
    g.gain.setValueAtTime(g.gain.value, c.currentTime); // part du volume actuel
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.03); // descend à zéro en 30 ms
    window.setTimeout(() => g.disconnect(), 80); // débranche ensuite
  } catch {
    /* le son est facultatif */
  }
}
