

OK, on abandonne l'idée du Payment Element intégré (trop complexe vs bénéfice). On reste sur Stripe Checkout mais on **règle vraiment le problème de la double saisie** sans casser ce qui marche.

## Le vrai problème

L'adresse saisie sur `/commande` n'est aujourd'hui PAS transmise à Stripe Checkout. La précédente tentative (pré-remplir via `customer_update` + création de customer côté serveur) a cassé l'affichage Stripe → on a rollback. Du coup on est revenu à zéro côté UX.

## Solution simple et robuste

**Pour les achats one-shot (numéros papier, digitaux)** : utiliser le mode `payment` de Stripe Checkout avec `payment_intent_data.shipping` qui accepte directement une adresse pré-remplie SANS passer par un objet Customer. C'est le mécanisme officiel et stable pour ce cas, ça n'avait pas été tenté.

**Pour les abonnements** : c'est là que ça avait cassé (mode `subscription` + `customer_update` = conflit). Solution : créer le Customer Stripe AVEC `shipping` et `address` pré-remplis dès la création (pas de `customer_update` ensuite), puis passer `customer: customerId` à la session **sans** `customer_update`. L'adresse sera affichée pré-remplie dans Checkout.

### Différence clé avec la tentative précédente

Avant : on faisait `customer.update()` ET `customer_update: { shipping: 'auto' }` dans la session → Stripe se retrouvait avec deux sources de vérité concurrentes → page bloquée.

Maintenant : on met l'adresse UNE SEULE FOIS (à la création du Customer, ou via `payment_intent_data.shipping`), et on retire complètement `customer_update`.

## Plan d'implémentation

### Modifier `supabase/functions/create-checkout/index.ts`

1. **Cas one-shot (mode `payment`)** :
   - Ajouter `payment_intent_data: { shipping: { name, address: { line1, line2, city, postal_code, country } } }`
   - Garder `shipping_address_collection` (Stripe affichera l'adresse pré-remplie, modifiable)
   - **Ne pas** créer/modifier de Customer

2. **Cas abonnement (mode `subscription`)** :
   - Créer le Customer avec `name`, `email`, `phone`, `address`, `shipping` en un seul appel `customers.create()`
   - Ne réutiliser un customer existant que s'il existe déjà ; sinon en créer un complet
   - Passer `customer: customerId` à la session
   - **Retirer complètement** `customer_update` (la cause du bug précédent)
   - Garder `shipping_address_collection` pour permettre la modification

3. Garder l'élargissement à 56 pays + tout le reste inchangé.

### Test obligatoire avant de valider

- Achat numéro papier (one-shot) : vérifier que l'adresse est pré-remplie sur Stripe et que la page s'affiche
- Achat abonnement 1 an : vérifier idem + que la page Stripe ne reste pas bloquée
- Achat numérique : vérifier qu'aucune adresse n'est demandée (déjà OK)

### Plan B si ça re-bloque

Si malgré tout le mode subscription re-bloque avec un Customer pré-rempli, fallback minimaliste : afficher sur `/commande` un message clair *"Vous confirmerez votre adresse à l'étape suivante (paiement sécurisé Stripe)"* et ne pas tenter de pré-remplir. Au moins le client est prévenu et ne se sent pas trahi.

### Fichiers concernés

- **Modifié** : `supabase/functions/create-checkout/index.ts` uniquement

Pas de migration DB, pas de nouveau composant, pas de refacto frontend. C'est une modif chirurgicale dans une seule Edge Function.

