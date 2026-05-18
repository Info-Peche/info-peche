## Contexte

L'offre **« abonnement 6 mois / 3 numéros » à 14,50 €** est facturée par erreur **tous les mois** au lieu d'une fois tous les 6 mois.

Le produit Stripe `prod_Tyzh45p7SqdgGh` a 2 prix :
- ❌ `price_1T11i1KbRd4yKDMHppfC8rE9` — 14,50 € **/ mois** (utilisé à tort)
- ✅ `price_1TVbcZKbRd4yKDMHu80N9Mif` — 14,50 € **/ 6 mois** (le bon)

**3 abonnements actifs sont à corriger** :

| Sub | Customer | Action |
|---|---|---|
| `sub_1TOjDQKbRd4yKDMHnxEIocGc` | `cus_UNUAHk9wt0HxTG` | switch price + recaler renouvellement |
| `sub_1TNDpkKbRd4yKDMHOlhvOoaE` | `cus_ULvh1HZ4lZBRot` (Christian Duvivier) | idem |
| `sub_1TEHayKbRd4yKDMHl8hG6JTm` | `cus_UCgxwUf5416uwD` | idem |

**Décisions validées :**
- Cadence cible : **1 fois tous les 6 mois**
- Pas de remboursement des cycles déjà perçus à tort (on ne corrige que le futur)

## Étape 1 — Corriger le code (cause racine)

Identifier où `price_1T11i1KbRd4yKDMHppfC8rE9` est référencé (probablement `create-checkout` ou un mapping de products côté front) et le remplacer par `price_1TVbcZKbRd4yKDMHu80N9Mif`. Comme ça, **plus aucun nouveau client ne sera créé sur le mauvais prix**.

## Étape 2 — Créer une edge function `fix-monthly-to-biannual`

Pour chacune des 3 subs existantes, elle va :

1. **Switcher l'item de subscription** vers le bon price (6 mois) :
   ```
   stripe.subscriptions.update(sub_id, {
     items: [{ id: <si_xxx>, price: 'price_1TVbcZKbRd4yKDMHu80N9Mif', deleted: false },
             { id: <si_xxx_old>, deleted: true }],
     proration_behavior: 'none',           // pas de facture immédiate
     trial_end: <sub.created + 6 mois>,    // recale la prochaine facturation
     cancel_at: null
   })
   ```
2. Si `sub.created + 6 mois` est déjà passé (peu probable, sub la plus vieille = ~5 mois) → fallback à `now() + 6 mois`.
3. **Mettre à jour `orders.subscription_end_date`** dans la DB pour ces 3 emails, sinon les rappels J-15/J-1 partiront à la mauvaise date.

Mode `dry_run: true` d'abord (affiche email | sub_id | created | nouvelle date renouvellement | action), puis exécution réelle après validation.

## Étape 3 — Vérification

- Re-query Stripe : les 3 subs doivent être sur `price_1TVbcZ…`, `current_period_end` ≈ created + 6 mois.
- SELECT en DB : `subscription_end_date` mis à jour.
- Confirmer qu'aucune nouvelle facture mensuelle ne partira (la prochaine sera dans 6 mois après création).

## Détails techniques

- **Pas de mention « essai gratuit »** : `trial_end` n'envoie pas d'email Stripe si les notifications trial ne sont pas activées dans le dashboard (déjà vérifié pour le bulk renewal). Le client ne reçoit donc rien de Stripe.
- **Idempotent** : si la sub est déjà sur le bon price, ne fait rien.
- **Pas de remboursement** : le `proration_behavior: 'none'` garantit qu'aucune facture immédiate ni crédit n'est généré.

## Livrables

1. Patch du code (replace `price_1T11i1…` → `price_1TVbcZ…`)
2. Edge function `fix-monthly-to-biannual` (avec `dry_run`)
3. Dry-run pour validation → exécution réelle après ton « go »
4. Récap final (Stripe + DB)
