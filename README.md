# Prix des carburants

Application Next.js (App Router) + Leaflet / OpenStreetMap pour trouver la station-service la moins chère.

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Fonctionnement

- Choix du carburant, de la région, du département et de la ville (ou recherche par adresse / code postal).
- Bouton « Autour de ma position » : stations dans un rayon de 2 à 50 km, avec la distance.
- Classement par prix croissant (100 premières stations affichées), liste et carte liées : un clic sur une ligne centre la carte et ouvre la fiche.
- Les carburants en rupture, sans prix ou avec un prix aberrant sont exclus.

## Données

`public/data/stations.json` est généré depuis le JSON « Prix des carburants en France – flux instantané v2 » (data.economie.gouv.fr).

Pour mettre à jour les prix :

1. Remplacer `data/stations-source.json` par un export récent du jeu de données.
2. `npm run extract`
3. Relancer l'appli.

Notes : les coordonnées viennent du champ `geom` (les champs `latitude`/`longitude` du fichier sont projetés). Le fichier ne contient ni nom ni enseigne de station.

## Limites

- Données statiques : les prix ne se rafraîchissent pas tout seuls.
- La distance est à vol d'oiseau, pas un temps de trajet.
- Respecter la politique d'utilisation des tuiles OpenStreetMap (usage modéré, ou fournisseur de tuiles dédié en production).
