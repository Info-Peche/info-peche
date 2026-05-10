## Objectif

Recaler la date de renouvellement Stripe **et** la `subscription_end_date` côté DB pour les **105 clients du Google Sheet** (sauf `gianna5652@gmail.com` et `gregory.gobin44@orange.fr`), en se basant sur la **vraie date de 1ʳᵉ commande** (pas le doublon de migration du 10 mai).

## Ce que j'ai vérifié

1. **Le sheet contient 107 lignes** (~105 emails uniques), à filtrer (-2 exclus).
2. **L'email de rappel J-15 / J-1** (`subscription-renewal-reminders`) lit la date dans `orders.subscription_end_date` et **ne mentionne PAS d'essai gratuit** — wording actuel : *« sera automatiquement reconduit le {date} »*. ✅
3. **Mais** : `orders.subscription_end_date` est parfois faux (= date du doublon migration). Donc il **faut aussi mettre à jour la DB** sinon le rappel partira à la mauvaise date.
4. **Stripe n'enverra pas d'email "fin d'essai"** par défaut (les emails de fin de trial ne sont actifs que si activés explicitement dans le dashboard Stripe). À confirmer avant lancement, je vérifie ce paramètre côté Stripe en dry-run.

## Étapes

### 1. Créer une edge function `bulk-fix-renewal-anchor`

Pour chaque email du sheet (sauf les 2 exclus), elle va :
- Trouver le client Stripe + sa sub active/trialing
- Lister ses factures, **identifier la 1ʳᵉ facture `subscription_create` payée** (la légitime, pas le `subscription_update` du 10 mai 2026)
- Calculer `target_date = date_première_facture + 2 ans`
- En mode `dry_run` : ne rien faire, juste produire un tableau `email | sub_id | first_invoice_date | current_renewal | target_date | orders_db_date | action`
- En mode réel : `subscriptions.update` avec `trial_end = target`, `proration_behavior: 'none'`, `cancel_at: null` **+** `UPDATE orders SET subscription_end_date = target WHERE email = ... AND is_recurring = true AND payment_status = 'paid'`

### 2. Lancer `bulk-fix-renewal-anchor` en **dry-run** d'abord

Je te livre un CSV/tableau récapitulatif des 105 clients :
- ✅ Cas standards (1 sub trouvée, 1ʳᵉ facture identifiée clairement)
- ⚠️ Cas ambigus (plusieurs subs, plusieurs `subscription_create`, déjà au bon anchor, etc.) → tu valides au cas par cas

### 3. Une fois le dry-run validé, exécution réelle

Lot par lot (10–20 clients par appel pour éviter timeout), avec log détaillé.

### 4. Vérification post-traitement

- Re-query Stripe pour 5 clients témoins
- `SELECT email, subscription_end_date FROM orders WHERE email IN (...)` pour vérifier la DB
- Confirmer que le cron `subscription-renewal-reminders` enverra bien les rappels J-15 aux bonnes dates

## Questions / points de vigilance

- **Stripe trial-end emails** : je vérifie au moment du dry-run si `subscription.trial_settings.end_behavior` ou les notifications Stripe trial sont activées. Si oui, il faudra utiliser une autre approche (`billing_cycle_anchor` à la place de `trial_end`) pour éviter de leur envoyer "votre essai gratuit se termine".
- **2 emails exclus** : `gianna5652@gmail.com` et `gregory.gobin44@orange.fr` — ne seront ni listés ni modifiés.
- **Aucun remboursement** déclenché — uniquement le repositionnement de date.

## Livrables

1. Edge function `bulk-fix-renewal-anchor` (avec `dry_run`, `email_filter`, `exclude_emails`)
2. Tableau récap dry-run pour validation
3. Exécution réelle après ton "go"
