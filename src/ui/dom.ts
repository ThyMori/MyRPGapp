// Petits outils pour retrouver des éléments de la page.

// Retrouve un élément par son identifiant ; s'il manque, on le dit clairement (l'écran d'erreur de démarrage l'affichera).
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id); // cherche l'élément
  if (!el) throw new Error(`Élément #${id} introuvable dans index.html`); // message utile pour le dépannage
  return el as T; // rend l'élément
}

// Retrouve plusieurs éléments par sélecteur CSS, sous forme de vraie liste.
export function all<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector)); // liste des éléments trouvés
}
