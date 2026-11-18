// Résumés courts (de ma main, jamais de phrase du livre) affichés par les boutons « i » de la fiche.
// Logique pure, sans DOM. Pour tous les détails exacts, le livre de base fait foi (page indiquée).

// Les catégories d'éléments qui ont une fiche d'information.
export type Categorie = 'culture' | 'avantage' | 'particularite' | 'vocation' | 'voie' | 'defaut' | 'niveauVie' | 'garant' | 'vertu' | 'recompense';

// Le contenu d'une fenêtre d'information.
export interface Detail {
  resume: string; // explication courte, avec mes mots
  page: number; // page du livre de base (numéro imprimé)
}

// Phrase ajoutée à chaque particularité : la règle commune (p.67).
export const REGLE_PARTICULARITE = 'Quand elle a du sens pour le jet, tu peux l’invoquer : le jet est alors Inspiré (2 dés d’Espoir au lieu d’1 si tu dépenses un point d’Espoir).';

// Fabrique un détail (raccourci d’écriture).
const d = (resume: string, page: number): Detail => ({ resume, page });

// Les résumés, rangés par catégorie puis par nom exact (celui des listes).
const DETAILS: Record<Categorie, Record<string, Detail>> = {
  culture: {
    'Bardides': d('Peuple du Val et de la cité de Dale, marqué par l’ombre de Smaug. Gens courageux, au niveau de vie prospère.', 32),
    'Elfes du Lindon': d('Elfes aînés, fins et lents à se libérer de l’Ombre. Niveau de vie modeste.', 34),
    'Hobbits de la Comté': d('Petites gens sensées, discrètes et tenaces. Niveau de vie courant.', 36),
    'Hommes de Bree': d('Gens de carrefour, ouverts aux autres peuples. Niveau de vie courant.', 38),
    'Nains du Peuple de Durin': d('Nains endurants, durs au mal et à la charge. Niveau de vie prospère.', 40),
    'Rôdeurs du Nord': d('Derniers descendants des rois d’Arnor, gardiens discrets des terres sauvages. Niveau de vie modeste.', 42),
  },
  avantage: {
    'Intrépide': d('Tes tests de Vaillance sont favorisés.', 32),
    'Précision elfique': d('Si tu n’es pas Mélancolique, tu peux dépenser 1 Espoir pour obtenir une réussite magique sur une compétence dont tu as au moins un rang.', 34),
    'Bon sens hobbit': d('Tes tests de Sagesse sont favorisés, et tu gagnes 1 dé aux tests d’Ombre contre la Cupidité.', 36),
    'Originaire de Bree': d('Chaque Homme de Bree de la Compagnie ajoute 1 à la valeur de Communauté.', 38),
    'Infatigable': d('La Charge de ton armure (casque compris, bouclier exclu) est divisée par deux, arrondie au supérieur.', 40),
    'Rois des Hommes': d('Ajoute 1 point à un Attribut de ton choix.', 42),
  },
  vocation: {
    'Capitaine': d('Tu es poussé à guider les autres. Compétences favorites au choix (deux parmi Art de la guerre, Inspiration, Persuasion).', 44),
    'Champion': d('Tu veux vaincre l’Ombre par les armes. Deux favorites parmi Athlétisme, Chasse, Présence.', 44),
    'Chasseur de trésors': d('Tu pars chercher fortune et secrets. Deux favorites parmi Discrétion, Exploration, Inspection.', 45),
    'Érudit': d('Tu cherches le savoir perdu. Deux favorites parmi Artisanat, Connaissances, Énigmes.', 45),
    'Messager': d('Tu portes nouvelles et liens entre les peuples. Deux favorites parmi Chant, Courtoisie, Voyage.', 45),
    'Protecteur': d('Tu veilles sur les autres. Deux favorites parmi Intuition, Soins, Vigilance.', 46),
  },
  voie: {
    'Attrait du pouvoir': d('Voie des chefs : l’autorité finit par servir l’ambition personnelle. Défauts : Amer, Arrogant, Présomptueux, Tyrannique.', 140),
    'Attrait des secrets': d('Voie des érudits : le savoir devient un bien qu’on garde pour soi. Défauts : Hautain, Méprisant, Calculateur, Fourbe.', 140),
    'Folie itinérante': d('Voie des messagers : la route use, on se détache de tout. Défauts : Fainéant, Distrait, Indifférent, Poltron.', 140),
    'Mal du Dragon': d('Voie des chercheurs de trésors : la cupidité prend le dessus. Défauts : Avide, Suspicieux, Malhonnête, Voleur.', 140),
    'Malédiction de vengeance': d('Voie des champions : la haine mène à la cruauté. Défauts : Rancunier, Brutal, Cruel, Meurtrier.', 140),
    'Voie du désespoir': d('Voie des protecteurs : le fardeau fait perdre courage. Défauts : Troublé, Hésitant, Honteux, Craintif.', 140),
  },
  niveauVie: {
    'Pauvre': d('Niveau de misère : pas de quoi s’équiper pour partir à l’aventure. Pas un niveau de départ.', 72),
    'Modeste': d('Vie simple, peu d’objets de valeur hors l’Attirail de guerre. Trésor de départ : 0.', 72),
    'Courant': d('Assez pour vivre sans excès, on marchande tout. Trésor de départ : 30.', 72),
    'Prospère': d('Voyages et auberges payés sans souci, parfois pour un compagnon. Trésor de départ : 90.', 72),
    'Riche': d('Confort et richesses surtout immobiles. Trésor de départ : 180.', 72),
    'Très riche': d('Niveau qu’aucune culture n’a au départ ; il se mérite après de longues aventures.', 72),
  },
  garant: {
    'Balin, fils de Fundin': d('Communauté +1. Dépenser 1 point de Communauté pour un jet de combat favorisé. Vocations favorites : Capitaine, Champion.', 52),
    'Bilbo Sacquet': d('Communauté +2. Le rencontrer rapporte +1 Communauté. Favorites : Chasseur de trésors, Érudit.', 52),
    'Círdan le Charpentier': d('Communauté +1. 1 point de Communauté relance tous les dés d’un jet ; le rencontrer donne une rumeur. Favorites : Érudit, Messager.', 52),
    'Gandalf le Gris': d('Communauté +2. 1 point de Communauté rend un test d’Ombre favorisé. Favorites : Capitaine, Messager.', 52),
    'Gilraen, fille de Dírhael': d('Communauté 0. Les voyages dans l’ancien Arnor se résolvent comme en Terres Frontalières ; le rencontrer donne une rumeur. Favorites : Champion, Protecteur.', 52),
    'Tom Bombadil et Baie d’Or': d('Communauté +2. Tous les points de Communauté demandent leur aide sur leurs terres. Favorites : Chasseur de trésors, Protecteur.', 52),
  },
  recompense: {
    'Acéré (arme)': d('Une arme acérée perce aussi sur un 9 du dé du Destin.', 79),
    'Ajusté (armure ou casque)': d('+2 à tes jets de Protection avec cette armure ou ce casque.', 79),
    'Astucieux (armure, casque ou bouclier)': d('La Charge de l’objet baisse de 2 (minimum 0).', 79),
    'Dévastateur (arme)': d('+1 aux dégâts de l’arme.', 79),
    'Féroce (arme)': d('+2 à la valeur de blessure de l’arme (aux deux mains si elle s’utilise ainsi).', 79),
    'Renforcé (bouclier)': d('+1 au modificateur de Parade du bouclier.', 79),
  },
  vertu: {
    // Vertus communes (p.79-80)
    'Assurance': d('+2 à ton Espoir maximal.', 80),
    'Habileté': d('Le SR d’un Attribut baisse de 1.', 80),
    'Main sûre': d('Tes coups spéciaux gagnent +1 : en Corps pour un Coup puissant, au dé du Destin pour une Perforation.', 80),
    'Maîtrise': d('Tu choisis deux nouvelles compétences communes favorites.', 80),
    'Résistance': d('Endurance maximale +2, ou ta Sagesse si elle est plus haute.', 80),
    'Vivacité': d('+1 à ta Parade.', 80),
    // Bardides (p.81-82)
    'Ami des Nains': d('Avec un Attachement envers un Nain, celui des deux en position défensive peut Protéger l’autre en action secondaire. Les Nains te sont toujours Amicaux en conseil.', 81),
    'Cram': d('Tu gagnes 1 Fatigue de moins par Événement de voyage. En repos court, la Compagnie regagne de l’Endurance en plus (ta Sagesse).', 81),
    'Grande destinée': d('Une fois, une blessure fatale te laisse Blessé mais vivant, et ton Espoir maximal monte de 1.', 81),
    'Langage des oiseaux': d('Tu communiques avec les oiseaux, et en extérieur tu peux être Inspiré une fois par combat, conseil ou voyage.', 81),
    'Pourfendeur de dragons': d('Contre une créature de Puissance 2 ou plus, tous tes jets d’attaque sont favorisés.', 82),
    'Tir féroce': d('Ta Perforation à distance rend le jet de Protection de la cible défavorisé.', 82),
    // Elfes du Lindon (p.82-84)
    'Elbereth Gilthoniel !': d('Espoir maximal +1. Pendant une Phase d’Aventure, tu peux être Inspiré autant de fois que ta Sagesse.', 82),
    'Fléau de l’Ombre': d('Une attaque réussie fait perdre à l’adversaire 1 Haine ou Détermination, plus 1 par symbole de réussite.', 83),
    'Mémoire des temps anciens': d('Tes Événements de voyage se tirent comme dans une région moins dangereuse, et tu peux aussi être Éclaireur.', 83),
    'Mortelle archerie': d('Avec un Arc en position arrière, ton action secondaire peut servir à Mettre en joue.', 83),
    'Rempart contre les spectres': d('Tes tests d’Ombre contre la Terreur sont favorisés ; tu gagnes 1 dé contre esprits et fantômes.', 84),
    'Rêves elfiques': d('Tu peux te reposer en faisant des tâches simples ; ton repos court compte comme prolongé.', 84),
    // Hobbits de la Comté (p.84-85)
    'Amis pour la vie': d('Communauté +1 et tu peux avoir un second Attachement.', 84),
    'Art de la disparition': d('Si un lieu offre la moindre cachette, un test de Discrétion réussi te fait disparaître aux yeux de tous.', 85),
    'Courageux si besoin': d('Blessé, Épuisé ou Mélancolique, tous tes jets sont Inspirés.', 85),
    'Droit au but': d('Tes attaques à distance sont favorisées ; une pierre lancée perce avec une blessure de 12.', 85),
    'Petit peuple': d('+2 à ta Parade contre une créature plus grande, et tu peux te mettre en arrière avec un seul allié au contact.', 85),
    'Solide comme un roc': d('Pour la gravité d’une blessure, tu lances deux dés du Destin et gardes le meilleur ; ton Corps compte double pour récupérer de l’Endurance au repos.', 85),
    // Hommes de Bree (p.85-87)
    'Aussi étrange que des nouvelles de Bree': d('Une rumeur par Phase de Communauté ; dans le Pays de Bree, 1 dé en Énigmes et Intuition.', 85),
    'Avenant': d('Un jet de compétence de plus en conseil, et les gens rencontrés te sont Amicaux.', 86),
    'Courage du désespoir': d('En dépensant de l’Espoir, tu peux gagner 1 Ombre pour être Inspiré sur ce jet.', 86),
    'L’art de fumer': d('Chaque fois que tu récupères de l’Espoir, tu en regagnes 1 de plus.', 86),
    'Obstination': d('Endurance maximale +1 ; en fin de combat, si tu n’es ni Blessé ni Mélancolique, tu récupères de l’Endurance (Cœur ou Vaillance, le plus haut).', 87),
    'Poney de Bree': d('Espoir maximal +1 ; ton poney a Vigueur 4 et reste près de toi.', 87),
    // Nains du Peuple de Durin (p.87-88)
    'Baruk Khazâd !': d('Une fois par combat en position avancée : attaque favorisée et Intimider l’adversaire en action secondaire.', 87),
    'Dur comme le fer': d('Endurance maximale +1 ; tes jets de Protection sont favorisés tant que tu n’es pas Mélancolique.', 88),
    'Esprit indomptable': d('Espoir maximal +1 ; 1 dé à tes tests d’Ombre contre la Sorcellerie.', 88),
    'L’obscurité pour les affaires obscures': d('Dans l’obscurité (nuit ou sous terre), tous tes jets sont Inspirés.', 88),
    'Sorts brisés': d('Trois compétences communes (au moins 1 rang) permettent, pour 1 Espoir, une réussite magique.', 88),
    'Voie de Durin': d('+2 à ta Parade sous terre ou en lieu exigu.', 88),
    // Rôdeurs du Nord (p.88-89)
    'Clairvoyance des ancêtres': d('Par Phase d’Aventure, ta Sagesse en fois : relancer tous les dés d’un jet, pour toi, un allié ou contre un adversaire.', 88),
    'Emblème dévoilé': d('Une fois par combat en position exposée : Rallier ses camarades, et toute la Compagnie est Inspirée au round suivant.', 88),
    'Endurance du rôdeur': d('Endurance maximale +1 ; sans armure (ou cuir sans heaume) et sans bouclier, pas de Fatigue en voyage.', 89),
    'Force d’esprit': d('1 dé à tes tests d’Ombre contre la Terreur.', 89),
    'Héritier d’Arnor': d('Avec le Gardien, tu crées une Relique merveilleuse ou une Arme fabuleuse (p.161) transmise ensuite à ton Héritier.', 89),
    'Sentiers des terres sauvages': d('En Chasse, Exploration ou Voyage, 1 Espoir donne une réussite magique ; tu peux tenir plusieurs rôles en voyage.', 89),
  },
  defaut: {},
  particularite: {},
};

// Particularités : un mot sur le trait (p.67-68), la règle commune est ajoutée à l'affichage.
const TRAITS: Record<string, string> = {
  'Affable': 'Aimable et poli, tu ne blesses personne sans le vouloir.',
  'Beau': 'La plupart des gens te trouvent attirant.',
  'Circonspect': 'Tu restes attentif à ce qui t’entoure et aux étrangers.',
  'Courageux': 'Tu as une grande confiance en toi face au danger.',
  'Curieux': 'Tu veux toujours en savoir plus.',
  'Entêté': 'Tu t’accroches à tes idées, quoi qu’on dise.',
  'Fier': 'Tu tiens à ton honneur et à celui des tiens.',
  'Généreux': 'Tu donnes sans compter.',
  'Grand': 'Ta haute taille impressionne.',
  'Honorable': 'Tu tiens parole et agis avec droiture.',
  'Impétueux': 'Provoqué, tu cèdes à tes instincts sauvages.',
  'Jovial': 'Gai et bon vivant, tu mets de l’entrain.',
  'Loyal': 'Tu restes fidèle à tes amis et à ta cause.',
  'Majestueux': 'Tu as un port noble qui impose le respect.',
  'Malin': 'Tu as l’esprit vif et rusé.',
  'Passionné': 'Tu t’investis entièrement dans ce que tu fais.',
  'Patient': 'Tu sais attendre sans t’énerver.',
  'Rapide': 'Tu es vif et agile.',
  'Rustre': 'Tu es franc, simple, sans manières.',
  'Secret': 'Tu gardes tes pensées et tes projets pour toi.',
  'Sévère': 'Tu es dur, sérieux et exigeant.',
  'Sincère': 'Tu dis ce que tu penses, sans détour.',
  'Subtil': 'Tu perçois et manies les nuances.',
  'Vue perçante': 'Tu repères ce que les autres ne voient pas.',
  // Particularités supplémentaires des vocations (p.44-46)
  'Commandement': 'Dans les situations tendues, on vient te demander quoi faire. (Vocation Capitaine)',
  'Connaissance des ennemis': 'Tu sais comment pensent et agissent tes adversaires. (Vocation Champion)',
  'Monte-en-l’air': 'Tu te faufiles et grimpes là où personne n’ose aller. (Vocation Chasseur de trésors)',
  'Rimes de savoir': 'Tu retiens le savoir ancien et ses chansons. (Vocation Érudit)',
  'Folklore': 'Tu connais récits, usages et rumeurs des peuples. (Vocation Messager)',
  'Conscience de l’Ombre': 'Tu sens la présence du mal avant les autres. (Vocation Protecteur)',
};
for (const [nom, trait] of Object.entries(TRAITS)) {
  DETAILS.particularite[nom] = d(`${trait} ${REGLE_PARTICULARITE}`, nom === 'Commandement' ? 44 : 67);
}

// Défauts : un mot sur le comportement (p.140-141), la règle commune est ajoutée à l'affichage.
export const REGLE_DEFAUT = 'Si une compétence est gênée par ce défaut, le Gardien des Légendes peut rendre ton test défavorisé.';
const COMPORTEMENTS: Record<string, string> = {
  'Amer': 'Tu en veux à ceux que tu diriges, qui ignorent ta sagesse.',
  'Arrogant': 'Tu rappelles sans cesse ton importance et rabaisses les autres.',
  'Présomptueux': 'Ton orgueil t’aveugle sur tes limites.',
  'Tyrannique': 'Tes désirs passent avant tout, et tu vois la contradiction comme une trahison.',
  'Hautain': 'Tu te crois au-dessus des autres.',
  'Méprisant': 'Tu dénigres ce que tu ne comprends pas ou ne valorises pas.',
  'Calculateur': 'Tu gardes tes intentions pour toi et ne suis que ton propre jugement.',
  'Fourbe': 'On ne peut te croire : tu trahis si cela t’avantage.',
  'Fainéant': 'Tu évites l’effort.',
  'Distrait': 'Ton esprit vagabonde et tu perds le fil.',
  'Indifférent': 'Rien ne te touche vraiment.',
  'Poltron': 'Tu fuis le danger.',
  'Avide': 'Tu veux toujours plus de richesses.',
  'Suspicieux': 'Tu soupçonnes tout le monde.',
  'Malhonnête': 'Tu mens et triches pour t’enrichir.',
  'Voleur': 'Tu t’appropries ce qui n’est pas à toi.',
  'Rancunier': 'Tu n’oublies jamais une offense.',
  'Brutal': 'Tu règles tout par la force.',
  'Cruel': 'Tu prends plaisir à la souffrance d’autrui.',
  'Meurtrier': 'Tu es prêt à tuer sans scrupule.',
  'Troublé': 'Tu es sans cesse tourmenté.',
  'Hésitant': 'Tu n’arrives pas à décider ni agir.',
  'Honteux': 'Tu te sens coupable et indigne.',
  'Craintif': 'Tu as peur de tout.',
};
for (const [nom, comportement] of Object.entries(COMPORTEMENTS)) {
  DETAILS.defaut[nom] = d(`${comportement} ${REGLE_DEFAUT}`, 141);
}

// Détail d'une valeur (null si vide ou inconnue, par exemple une saisie libre).
export function detailPour(categorie: Categorie, valeur: string): Detail | null {
  if (!valeur) return null; // rien de choisi
  return DETAILS[categorie][valeur] ?? null; // détail connu ou null
}

// Tous les noms connus d'une catégorie (pour les tests de couverture).
export function nomsDetailles(categorie: Categorie): string[] {
  return Object.keys(DETAILS[categorie]); // noms de la catégorie
}
