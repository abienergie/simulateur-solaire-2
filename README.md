# Simulateur Solaire

Application web de calcul de production solaire et simulation financière.

## Description

Simulateur solaire professionnel permettant de :
- Calculer la production solaire selon la localisation
- Estimer les économies d'énergie
- Générer des projections financières détaillées
- Produire des rapports personnalisés

## Technologies

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- Génération PDF

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/abienergie/simulateur-solaire.git

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

## Déploiement

Le site est automatiquement déployé sur GitHub Pages à l'adresse : https://abienergie.github.io/simulateur-solaire/

Pour déployer manuellement :

1. Créer une branche gh-pages :
```bash
git checkout -b gh-pages
```

2. Builder le projet :
```bash
npm run build
```

3. Pousser le dossier dist sur la branche gh-pages :
```bash
git add dist -f
git commit -m "Deploy"
git push origin gh-pages
```

4. Retourner sur main :
```bash
git checkout main
```

## Version

6.8.2 - Mars 2024