## Problème

GSC voit, dans le HTML statique de `/boutique`, une balise `<link rel="canonical" href="https://www.info-peche.fr">` qui pointe vers la home. Google considère donc `/boutique` comme un doublon de `/` et ne l'indexe pas. La canonique correcte est bien réécrite par `usePageSeo` côté client, mais Googlebot ne l'a pas exécutée lors du crawl du 31 mai.

## Correctif

**Fichier `index.html`** — supprimer la ligne 27 :

```html
<link rel="canonical" href="https://www.info-peche.fr" />
```

Chaque page définit déjà sa propre canonique :
- `Index.tsx` → `useCanonical("/")`
- `Shop.tsx` → `usePageSeo({ canonical: "/boutique", ... })`
- autres pages → idem via `usePageSeo` / `useCanonical`

Plus aucune canonique statique = plus de conflit ni de canonique erronée vue par Googlebot au premier crawl.

## Aucune autre modification

- Le sitemap edge function contient déjà `/boutique` ✅
- `robots.txt` autorise déjà le crawl ✅
- Pas besoin de toucher au code de Shop.tsx (déjà bien configuré)

## Après déploiement

1. Publier la modif.
2. Dans GSC → inspecter `https://www.info-peche.fr/boutique` → **Demander une indexation**.
3. Recrawl visible sous quelques jours.
