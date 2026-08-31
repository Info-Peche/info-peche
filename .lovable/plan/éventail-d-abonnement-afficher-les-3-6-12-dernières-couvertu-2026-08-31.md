# Éventail d'abonnement : afficher les 3-6-12 dernières couvertures

## Diagnostic (vérifié)
- `MagazineFanVisual.tsx` récupère déjà les couvertures depuis `digital_issues`, mais triées par `issue_number` **en texte** → « 99 » passe avant « 103 ».
- Résultat constaté sur l'aperçu : l'éventail affiche les numéros 99, 98, 97… au lieu des derniers numéros (103, 102, 101…). Les couvertures récentes existent bien en base (29 numéros, tous avec couverture, sans doublon).

## Action
1. Dans `src/components/MagazineFanVisual.tsx` : trier les numéros **numériquement** (extraction du nombre dans `issue_number`, tri décroissant) côté client après récupération, au lieu du tri texte de la requête.
2. Prendre les N couvertures les plus récentes distinctes (3, 6 ou 12 selon la formule) ; conserver le cycle de remplissage actuel en secours si moins de N couvertures disponibles.
3. Aucun changement visuel de mise en page : même éventail, mêmes dimensions, juste les bonnes couvertures (103, 102, 101 pour ×3, etc.).

## Impact
- Aucun impact Stripe/commandes, aucune migration : modification purement front d'un seul composant.
- S'applique partout où l'éventail est utilisé (cartes d'abonnement, points forts du contenu).
