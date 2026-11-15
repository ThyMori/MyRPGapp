// Tests du bouton « Retour ».
import { describe, expect, it } from 'vitest'; // outils de test
import { decideBack, type BackContext } from './backPolicy'; // fonction testée

// Contexte de départ : rien d'ouvert, sur l'écran d'accueil.
const repos: BackContext = { dialogOpen: false, menuOpen: false, drawerOpen: false, screen: 'roller', homeScreen: 'roller', exitArmed: false };

describe('decideBack', () => {
  it('ferme la fenêtre ouverte en premier, même si le tiroir est ouvert', () => {
    expect(decideBack({ ...repos, dialogOpen: true, drawerOpen: true })).toBe('close-dialog'); // priorité à la fenêtre
  });
  it('ferme le menu avant le tiroir', () => {
    expect(decideBack({ ...repos, menuOpen: true, drawerOpen: true })).toBe('close-menu'); // menu d'abord
  });
  it('ferme le tiroir avant de changer d’écran', () => {
    expect(decideBack({ ...repos, drawerOpen: true, screen: 'oracles' })).toBe('close-drawer'); // tiroir ensuite
  });
  it('revient à l’accueil depuis un autre écran', () => {
    expect(decideBack({ ...repos, screen: 'characters' })).toBe('go-home'); // remonte d'un niveau
  });
  it('demande confirmation avant de quitter, puis quitte', () => {
    expect(decideBack(repos)).toBe('arm-exit'); // premier appui : avertissement
    expect(decideBack({ ...repos, exitArmed: true })).toBe('exit'); // second appui : sortie
  });
});
