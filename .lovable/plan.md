

## Problème actuel

L'onglet **Édition du mois** met à jour uniquement la table `site_settings` (clé `current_edition`), qui alimente la page d'accueil (LatestEdition, PricingCards). Mais le champ `is_current` dans la table `digital_issues` (qui contrôle le tri en boutique et le badge "Numéro en cours") n'est **pas synchronisé**. Il faut actuellement le modifier manuellement — ce qui n'est possible nulle part dans l'admin actuel.

## Plan

### 1. Synchroniser automatiquement `is_current` lors de la sauvegarde de l'Édition du mois

Dans `AdminEditionManager.tsx`, après la sauvegarde dans `site_settings`, ajouter une logique qui :
- Recherche dans `digital_issues` le numéro correspondant au `issue_number` saisi (ex: "N°101" → cherche `issue_number = "101"` ou `"N°101"`)
- Si trouvé : met `is_current = true` sur ce numéro, et `is_current = false` sur tous les autres (2 requêtes Supabase)
- Affiche un toast de confirmation indiquant que la boutique a aussi été mise à jour
- Si pas trouvé : affiche un avertissement "Aucun numéro correspondant trouvé dans la boutique, pensez à le créer dans l'onglet Stock"

### 2. Ajouter un indicateur visuel dans l'Édition du mois

Afficher sous le champ "Numéro" un petit badge ou texte confirmant si ce numéro existe dans la boutique et s'il est bien marqué comme numéro en cours, pour donner confiance à l'admin.

### Fichiers modifiés
- `src/components/AdminEditionManager.tsx` — ajout de la synchro `is_current` dans `handleSave` + indicateur visuel

