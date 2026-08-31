# Remplacement de la couverture IP102

## Contexte vérifié
- Bucket public `magazine-covers`, chemin cible : `IP102_juillet-aout_2026_couverture.jpg`
- `site_settings.current_edition.cover_image` pointe déjà vers l'URL publique de ce chemin exact
- L'image en PJ est bien la couverture N°102 Juillet/août 2026 (format 1359×1920, .jpg)

## Action
1. Uploader `/mnt/user-uploads/IP102_juillet-aout_2026_couverture.jpg` dans le bucket `magazine-covers` au chemin `IP102_juillet-aout_2026_couverture.jpg`, en mode **upsert** (remplace le fichier existant à la même clé).
2. Vérifier que l'URL publique renvoie la nouvelle image (cache CDN peut nécessiter busting ; pas de changement d'URL donc pas de mise à jour DB nécessaire).
3. Confirmer le rendu sur la home / offres d'abonnement.

## À noter (hors-scope du remplacement)
- `current_edition.issue_number` = N°103 (Sept-Oct 2026) mais `cover_image` affiche encore la couverture N°102 : incohérence à régler séparément si tu veux aligner la couverture sur le N°103 (il faudrait alors uploader une couverture N°103 et mettre à jour `cover_image`).

## Impact
- Aucun prélèvement, aucun impact Stripe/commandes.
- Seul le fichier image du bucket est modifié ; l'URL et la DB ne bougent pas.
