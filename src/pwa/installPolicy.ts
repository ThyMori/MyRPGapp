// Règle du bandeau d'installation : reportable d'une semaine, trois fois au plus, puis seulement dans le menu.
// Fonctions pures (le « maintenant » est un paramètre).

// État mémorisé du bandeau.
export interface InstallState {
  dismissCount: number; // nombre de fois où l'utilisateur a repoussé le bandeau
  nextAt: number; // instant (ms) avant lequel on ne ré-affiche pas le bandeau
}

// Une semaine, en millisecondes.
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Nombre maximal de reports.
export const MAX_DISMISS = 3;

// État initial : jamais repoussé.
export const initialInstallState: InstallState = { dismissCount: 0, nextAt: 0 };

// Le bandeau doit-il s'afficher ? Non si l'app est déjà installée, si trois reports ont eu lieu, ou si la semaine n'est pas écoulée.
export function shouldShowBanner(s: InstallState, installed: boolean, maintenant: number): boolean {
  if (installed) return false; // déjà installée
  if (s.dismissCount >= MAX_DISMISS) return false; // assez insisté : le menu suffit
  return maintenant >= s.nextAt; // semaine écoulée ?
}

// Enregistre un report (« Plus tard ») : une semaine de répit.
export function dismissBanner(s: InstallState, maintenant: number): InstallState {
  return { dismissCount: s.dismissCount + 1, nextAt: maintenant + WEEK_MS }; // un report de plus
}

// Reconstruit l'état depuis le stockage (valeur possiblement abîmée).
export function sanitizeInstallState(raw: unknown): InstallState {
  if (typeof raw !== 'object' || raw === null) return initialInstallState; // rien de valable
  const o = raw as Partial<InstallState>; // vue partielle
  const count = typeof o.dismissCount === 'number' && o.dismissCount >= 0 ? Math.floor(o.dismissCount) : 0; // compteur valide
  const next = typeof o.nextAt === 'number' && Number.isFinite(o.nextAt) ? o.nextAt : 0; // date valide
  return { dismissCount: count, nextAt: next }; // état propre
}
