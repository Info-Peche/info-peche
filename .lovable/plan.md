## Objectif

Recaler la prochaine date de facturation de l'abonnement 2 ans d'Alain Vasseur (xhrouet@aol.com) au **18 mars 2028**, sans rien prélever.

## Cible

- Email : `xhrouet@aol.com`
- Subscription Stripe : `sub_1TDi86KbRd4yKDMHlFjWE26x` (active, 48 €/2 ans)
- Date de renouvellement actuelle : à vérifier (probablement mai 2028, comme les autres cas migration)
- **Date cible : 18 mars 2028** (= 1ʳᵉ facture du 18/03/2026 + 2 ans)

## Étapes

1. **Dry-run** de l'edge function `fix-sub-anchor` avec :
   ```json
   { "email": "xhrouet@aol.com", "target_date": "2028-03-18", "dry_run": true }
   ```
   → afficher le before / after attendu pour validation visuelle.

2. **Validation manuelle** par l'utilisateur du résultat dry-run.

3. **Exécution réelle** (même appel sans `dry_run`) → la fonction pose `trial_end = 2028-03-18 12:00 UTC`, `proration_behavior: 'none'`, `cancel_at: null`. Aucun débit déclenché.

4. **Vérification** dans Stripe Dashboard : la prochaine facture doit afficher « 48,00 € le 18 mars 2028 », puis tous les 2 ans (18 mars 2030, etc.).

## Notes

- Aucun remboursement n'est nécessaire (déjà fait côté utilisateur).
- Aucune modification du Google Sheet ni de la base.
- Si l'opération réussit, on pourra appliquer la même méthode aux autres abonnés 2 ans en attente, un par un avec leur propre date cible (1ʳᵉ commande légitime + 2 ans).
