// Calcule l'orientation d'un dé pour qu'une face donnée soit tournée vers le haut (vers la caméra), texte à l'endroit.
import { Matrix4, Quaternion, Vector3 } from 'three'; // outils de géométrie 3D

// Repère de la table : +Y = vers le haut (la caméra regarde d'en haut), -Z = haut de l'écran, +X = droite de l'écran.
// yaw : petite rotation autour de la verticale, pour que deux lancers ne se ressemblent pas exactement.
export function quaternionForFace(normal: Vector3, up: Vector3, yaw = 0): Quaternion {
  const droite = new Vector3().crossVectors(up, normal).normalize(); // axe « droite » du texte (droite = haut × normale)
  const local = new Matrix4().makeBasis(droite, up, normal); // repère de la face : droite, haut du texte, normale
  const cible = new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0)); // repère voulu : X, -Z, Y
  const rotation = cible.multiply(local.clone().transpose()); // rotation qui envoie le repère de la face sur le repère voulu
  const q = new Quaternion().setFromRotationMatrix(rotation); // convertie en quaternion
  const lacet = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw); // rotation autour de la verticale
  return lacet.multiply(q); // on applique d'abord q, puis le lacet
}
