// Tests du bandeau d'installation et de la détection d'appareil.
import { describe, expect, it } from 'vitest'; // outils de test
import { MAX_DISMISS, WEEK_MS, dismissBanner, initialInstallState, sanitizeInstallState, shouldShowBanner } from './installPolicy'; // règle du bandeau
import { detectPlatform, installSteps } from './platform'; // détection d'appareil

describe('bandeau d’installation', () => {
  const t0 = 1_000_000; // un instant quelconque
  it('s’affiche au départ', () => {
    expect(shouldShowBanner(initialInstallState, false, t0)).toBe(true); // jamais repoussé
  });
  it('ne s’affiche pas si l’app est installée', () => {
    expect(shouldShowBanner(initialInstallState, true, t0)).toBe(false); // déjà installée
  });
  it('se tait une semaine après « Plus tard »', () => {
    const s = dismissBanner(initialInstallState, t0); // un report
    expect(shouldShowBanner(s, false, t0 + WEEK_MS - 1)).toBe(false); // juste avant la fin de la semaine
    expect(shouldShowBanner(s, false, t0 + WEEK_MS)).toBe(true); // semaine écoulée
  });
  it('ne s’affiche plus après trois reports', () => {
    let s = initialInstallState; // départ
    for (let i = 0; i < MAX_DISMISS; i++) s = dismissBanner(s, t0 + i * WEEK_MS); // trois reports
    expect(shouldShowBanner(s, false, t0 + 10 * WEEK_MS)).toBe(false); // plus jamais
  });
  it('se remet d’un stockage abîmé', () => {
    expect(sanitizeInstallState('x')).toEqual(initialInstallState); // texte
    expect(sanitizeInstallState({ dismissCount: -3, nextAt: 'a' })).toEqual(initialInstallState); // valeurs absurdes
  });
});

describe('detectPlatform', () => {
  it('reconnaît Firefox Android', () => {
    expect(detectPlatform('Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0')).toBe('android-firefox'); // Firefox mobile
  });
  it('reconnaît Chrome Android', () => {
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36')).toBe('android-chrome'); // Chrome mobile
  });
  it('reconnaît iPhone', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')).toBe('ios-safari'); // Safari iOS
  });
  it('reconnaît Chrome et Firefox sur ordinateur', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36')).toBe('desktop-chrome'); // Chrome
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0')).toBe('desktop-firefox'); // Firefox
  });
  it('propose toujours au moins une étape', () => {
    expect(installSteps('other').length).toBeGreaterThan(0); // guide générique
    expect(installSteps('android-firefox')).toHaveLength(3); // guide Firefox Android
  });
});
