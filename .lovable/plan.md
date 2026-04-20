

L'utilisateur n'a pas de compte Google Cloud → on **abandonne l'autocomplétion Google Places**. On garde uniquement l'élargissement des pays Stripe + la liste interne. Le reste du plan (réconciliation des paiements pending) reste inchangé.

## Plan révisé

### 1. Correction immédiate des 2 commandes pending (Martial & Thierry)

Réconcilier en relançant `verify-payment` avec leurs `session_id` Stripe. Résultat :
- `payment_status` → `paid`, `status` → `confirmed`
- attribution du numéro de commande + numéro d'abonné
- dates de début/fin d'abonnement correctes (24 mois Martial, 12 mois Thierry)
- création/MAJ de la fiche client + envoi des emails de confirmation

### 2. Filet de sécurité — nouvelle Edge Function `reconcile-pending-orders`

Pour éviter que ça se reproduise (clients qui ferment l'onglet après paiement Stripe avant le retour sur `/commande-confirmee`).

La fonction :
- récupère les commandes `payment_status = 'pending'` créées il y a entre 15 min et 7 jours
- pour chacune, interroge Stripe via `stripe_checkout_session_id`
- si Stripe = `paid` → exécute la même logique que `verify-payment` (finalisation complète, idempotente)
- si Stripe = `expired` ou >24h sans paiement → marque comme `expired`

Planification **pg_cron toutes les 15 minutes**.

### 3. Refacto léger de `verify-payment`

Extraire la logique de finalisation dans une fonction utilitaire interne, partagée entre `verify-payment` et `reconcile-pending-orders`, pour garantir un comportement strictement identique (mêmes emails, mêmes dates, idempotence).

### 4. Élargissement des pays acceptés (sans autocomplétion Google)

**a) Stripe Checkout** — dans `supabase/functions/create-checkout/index.ts`, étendre `shipping_address_collection.allowed_countries` à une liste large :
- Europe : FR, BE, CH, LU, MC, DE, IT, ES, PT, NL, GB, IE, AT, DK, SE, FI, NO, PL, CZ, GR, HU, RO, BG, HR, SI, SK, EE, LV, LT, IS, MT, CY
- Amérique du Nord : US, CA
- Maghreb / Afrique francophone : MA, TN, DZ, SN, CI, CM, GA, BF, BJ, ML, TG, MG, RE
- DOM-TOM : GP, MQ, GF, YT, PF, NC

**b) Liste front `SHIPPING_COUNTRIES`** dans `src/lib/shipping.ts` — ajouter les principaux pays (Allemagne, Italie, Espagne, Portugal, Pays-Bas, Royaume-Uni, USA, Canada, Maroc, Tunisie, Algérie, Sénégal, Belgique, Suisse, Luxembourg, Monaco, etc.) avec tarif `international` appliqué automatiquement (sauf FR).

**c) Améliorer le sélecteur de pays dans Checkout** — passer d'un `<select>` à un **Combobox cherchable** (composant shadcn `Command` déjà disponible) pour faciliter la recherche parmi ~50 pays. Le client tape les premières lettres de son pays, sélectionne, et continue.

### Fichiers concernés

- **Nouveau** : `supabase/functions/reconcile-pending-orders/index.ts`
- **Nouveau** : migration SQL pour le cron (15 min)
- **Modifié** : `supabase/functions/verify-payment/index.ts` (refacto)
- **Modifié** : `supabase/functions/create-checkout/index.ts` (allowed_countries élargi)
- **Modifié** : `src/lib/shipping.ts` (liste de pays étendue)
- **Modifié** : `src/pages/Checkout.tsx` (Combobox pays cherchable)
- **Action immédiate** : relancer `verify-payment` pour les 2 sessions pending

### Note importante sur la simplification d'adresse

Sans autocomplétion d'adresse externe, on ne peut pas pré-remplir automatiquement code postal/ville depuis une frappe libre. En revanche, le **Combobox pays cherchable** + l'élargissement Stripe permettront déjà à un Italien, Allemand ou Marocain de finaliser sa commande sans bug. Si plus tard tu crées un compte Google Cloud (gratuit, 200 $/mois de crédit Maps), on pourra ajouter l'autocomplétion par-dessus en 1 PR.

