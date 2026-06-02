## Objectif

Optimiser le SEO de la page `/boutique` et mettre à jour le title.

## Modifications dans `src/pages/Shop.tsx`

Enrichir l'appel à `usePageSeo` :

- **title** : `Boutique - Tous vos magazines de pêche dans votre format préféré : abonnement, papier, numérique !`
- **description** : reformulée (< 160 caractères) avec mots-clés (abonnement, papier, numérique, anciens numéros, pêche au coup)
- **canonical** : `/boutique` (déjà présent — confirmé)
- **ogType** : `website`
- **ogImage** : visuel de couverture représentatif (logo Info Pêche ou cover du numéro en cours)
- **jsonLd** : ajout d'un schéma `BreadcrumbList` (Accueil → Boutique) + `CollectionPage` listant la boutique comme catalogue de magazines

## Vérifications SEO complémentaires

- Confirmer qu'il n'y a qu'un seul `<h1>` sur la page (actuellement « Retrouvez tous les anciens magazines » — OK)
- Vérifier que les images des couvertures ont bien un `alt` descriptif (déjà OK : `alt={issue.title}`)
- Le `<link rel="canonical">` est géré par `usePageSeo` → pas de doublon avec `index.html`

## Notes

Aucune modification de logique métier ni de structure visuelle. Uniquement les balises `<head>` et JSON-LD de la page Boutique.
