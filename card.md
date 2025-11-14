## Card Layout Specs

### Dimensions globales
- Largeur fixe desktop : **356 px**
- Largeur mobile : **max 320 px** (cartes centrées avec `w-full max-w-[320px]`)
- Marges/paddings internes : inchangés

### Ancien format (avant refonte portrait)
- Image recommandée : **1200 × 900 px** (ratio **4:3**)
- Bloc image affiché : hauteur fixe **267 px**
- Section contenu : restait autour de **213 px** (selon texte), pour une carte d’environ **480 px** de haut

### Nouveau format (aligné Instagram portrait)
- Image recommandée : **1080 × 1350 px** (ratio **4:5**)
- Bloc image affiché : largeur 356 px avec `aspect-ratio: 4 / 5` ⇒ hauteur visuelle ≈ **445 px**
- Section contenu : hauteur variable (texte/actions) **≈ 120‑150 px** selon la longueur
- Hauteur totale : oscille entre **580 et 620 px** suivant le contenu
- Formats acceptés : **JPG, PNG**

> Objectif : refléter un visuel plein cadre type publication Instagram portrait tout en gardant une largeur maîtrisée (320 px mobile, 356 px desktop) pour préserver la grille existante.
