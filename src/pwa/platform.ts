// Détection de l'appareil et guide d'installation adapté. Fonctions pures (l'agent utilisateur est un paramètre).

// Appareils/navigateurs distingués.
export type Platform = 'ios-safari' | 'android-firefox' | 'android-chrome' | 'desktop-chrome' | 'desktop-firefox' | 'other';

// Devine l'appareil à partir du texte « user agent » du navigateur.
export function detectPlatform(ua: string): Platform {
  const iOS = /iPhone|iPad|iPod/i.test(ua); // appareil Apple mobile
  const android = /Android/i.test(ua); // appareil Android
  const firefox = /Firefox|FxiOS/i.test(ua); // navigateur Firefox
  const chromeLike = /Chrome|CriOS|Edg\//i.test(ua); // Chrome, Edge ou dérivés
  if (iOS) return 'ios-safari'; // sur iPhone, l'installation passe par Safari
  if (android && firefox) return 'android-firefox'; // Firefox sur Android
  if (android && chromeLike) return 'android-chrome'; // Chrome sur Android
  if (firefox) return 'desktop-firefox'; // Firefox sur ordinateur
  if (chromeLike) return 'desktop-chrome'; // Chrome ou Edge sur ordinateur
  return 'other'; // autre cas
}

// Étapes d'installation à afficher selon l'appareil.
export function installSteps(p: Platform): string[] {
  switch (p) {
    case 'android-firefox':
      return ['Ouvre le menu ⋮ de Firefox (en haut à droite).', 'Touche « Installer ».', 'Confirme : l’icône apparaît sur ton écran d’accueil.'];
    case 'android-chrome':
      return ['Ouvre le menu ⋮ de Chrome.', 'Touche « Installer l’application » (ou « Ajouter à l’écran d’accueil »).', 'Confirme : l’icône apparaît sur ton écran d’accueil.'];
    case 'ios-safari':
      return ['Ouvre cette page dans Safari.', 'Touche le bouton Partager (le carré avec une flèche).', 'Choisis « Sur l’écran d’accueil », puis « Ajouter ».'];
    case 'desktop-chrome':
      return ['Cherche l’icône d’installation à droite de la barre d’adresse.', 'Clique dessus, puis sur « Installer ».'];
    case 'desktop-firefox':
      return ['Firefox sur ordinateur ne sait pas installer les applications web.', 'Utilise Chrome ou Edge pour l’installer, ou garde simplement cet onglet épinglé.'];
    default:
      return ['Cherche « Installer » ou « Ajouter à l’écran d’accueil » dans le menu de ton navigateur.'];
  }
}
