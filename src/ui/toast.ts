// Message unique en bas de l'écran : un seul à la fois, disparaît après 6 secondes, visible où qu'on soit.
import { byId } from './dom'; // outil de recherche d'élément

let minuteur: number | undefined; // compte à rebours de disparition

// Types de message : information, succès ou erreur (la couleur du bord change).
export type ToastKind = 'info' | 'ok' | 'error';

// Affiche un message (il remplace le précédent). Le texte est inséré comme texte, jamais comme HTML.
export function showToast(message: string, kind: ToastKind = 'info'): void {
  const el = byId('toast'); // la zone du message
  el.textContent = message; // le texte, sans interprétation HTML
  el.className = kind === 'info' ? 'toast' : `toast ${kind}`; // couleur selon le type
  el.hidden = false; // montre le message
  window.clearTimeout(minuteur); // annule le compte à rebours précédent
  minuteur = window.setTimeout(hideToast, 6000); // il disparaîtra dans 6 secondes
}

// Cache le message.
export function hideToast(): void {
  window.clearTimeout(minuteur); // plus de compte à rebours
  byId('toast').hidden = true; // cache
}

// Toucher le message le ferme tout de suite.
export function initToast(): void {
  byId('toast').addEventListener('click', hideToast); // fermeture au toucher
}
