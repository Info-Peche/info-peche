# Nouveaux tarifs d'abonnement (à partir du 1er nov. 2026)

| Formule | Ancien | Nouveau |
|---|---|---|
| 6 mois (3 n°) | 14,50 € | 16,50 € |
| 1 an (6 n°) | 26,50 € | 29,90 € |
| 2 ans (12 n°) | 48 € | 52 € |

Règle de sécurité : **aucun prélèvement immédiat**. Aucune facture créée, aucun prorata.

## 1. Stripe
- Créer 3 nouveaux prix sur les produits existants (même fréquence que les actuels : tous les 6 mois / 1 an / 2 ans).
- Les anciens prix restent actifs le temps de la bascule (pas d'archivage avant vérification).

## 2. Site (nouvelles commandes)
- Mettre à jour les prix et les nouveaux identifiants Stripe dans la liste des produits.
- Mettre à jour tous les prix écrits en dur : cartes tarifs (prix par numéro : 5,50 € / 4,98 € / 4,33 €), paiement en 4× au checkout (4 × 13 €), FAQ et données Google (rich snippets), mentions éventuelles dans les CGV / page abonnement.
- Ajouter les nouveaux identifiants dans toutes les correspondances (libellés admin, accès numérique, vérification paiement, rappels de renouvellement, ligne « Renouvellement abo … » du webhook, calcul de durée).

## 3. Abonnés en cours (nouveau prix au renouvellement)
- Fonction dédiée, **testée d'abord en simulation** (liste des abonnés + ancien/nouveau prix + date de renouvellement), puis exécutée après ton feu vert.
- Changement de prix avec `proration_behavior: none` et date de renouvellement **inchangée** → le nouveau tarif s'applique uniquement au prochain prélèvement prévu.
- Contrôle après coup : aucune facture créée, dates de renouvellement identiques à avant.
- Email J-15 : ajouter le montant du renouvellement pour prévenir de la hausse (à valider : tu préfères un message neutre ou une phrase explicative ?).

## 4. Vérifications
- Commande test jusqu'à la page de paiement Stripe pour chaque formule : bon montant affiché.
- Contrôle visuel des pages tarifs, boutique, checkout.
- Test automatique sur les 3 prix.

## Détails techniques
- Fichiers : `src/lib/products.ts`, `PricingCards.tsx`, `JsonLd.tsx`, `Checkout.tsx`, `AdminDashboard.tsx`, fonctions `verify-payment`, `check-subscription`, `get-magazine-url`, `stripe-webhook`, `subscription-renewal-reminders`, `create-checkout`.
- Mémoire tarifs mise à jour.
