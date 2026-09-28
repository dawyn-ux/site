# Connect Systèmes — nouveau site internet

Proposition de refonte du site de **CONNECT SYSTEMES** (Saint-Priest, 69), distributeur en connectique depuis 1991.
L'ancien site (`http://connect-systemes.fr`) n'est pas sécurisé (HTTP) et date de l'époque des pages `.htm` :
cette version le remplace par un site rapide, sécurisé (HTTPS), optimisé pour Google et modifiable sans développeur.

## Points forts

| | |
|---|---|
| **Identité** | **Logo d'origine redessiné en vectoriel** (monogramme « CS » framboise, halos bleu pâle, lettrages CONNECT / SYSTEMES), couleurs du site reprises du logo : framboise `#D3014E`, bleu `#4680BF`, bleu ciel `#C1DCF2`, bleu pâle `#E1ECF9`, noir. Les halos du logo servent de motif décoratif, et le lettrage CONNECT est repris en grand en pied de page. |
| **3D interactive** | Faisceau électrique en Three.js sur l'accueil : contacts sertis, boîtier, repère, gaine thermorétractable, tresse ; impulsions de courant animées. On peut le faire pivoter, et chaque repère mène à la gamme correspondante. Chargé à la demande, avec une illustration de secours sans WebGL. |
| **Administration** | Decap CMS en français sur `/admin` : gammes, documents PDF, actualités, textes des pages, coordonnées, couleurs, SEO. Chaque modification crée un commit GitHub, puis Vercel republie le site en 1 à 2 minutes environ. |
| **SEO** | Pages statiques très rapides, balises title/description modifiables (avec longueurs contrôlées), URL canoniques, Open Graph, sitemap, robots.txt, données structurées (LocalBusiness, BreadcrumbList, ItemList, Service, NewsArticle), flux RSS, `llms.txt`, **redirections 301 des anciennes pages `.htm`**. |
| **Conformité** | Mentions légales, politique de confidentialité, polices hébergées localement (pas d'appel à Google Fonts), aucun cookie de suivi, formulaire avec consentement RGPD et anti-spam. |
| **Accessibilité** | Contrastes, navigation clavier, lien d'évitement, `prefers-reduced-motion` respecté, textes alternatifs. |

## Technologies

- [Astro 7](https://astro.build) : génération de pages statiques, avec l'adaptateur Vercel pour les 3 fonctions serveur (`/api/*`)
- [Three.js](https://threejs.org) : scène 3D de l'accueil
- [Decap CMS](https://decapcms.org) : interface d'administration, contenus stockés dans le dépôt Git
- Contenus : Markdown/YAML (`src/content/`) et JSON (`src/data/`), validés au build : une saisie invalide bloque le déploiement, et la version en ligne reste intacte.

## Démarrer en local

```bash
npm install
npm run dev          # site sur http://localhost:4321
npm run cms          # (autre terminal) permet d'utiliser /admin en local, sans GitHub
npm run build        # build de production
npm run check        # vérification TypeScript
```

Node.js 22.12 ou plus récent est requis.

## Mise en ligne sur Vercel

1. Pousser ce dépôt sur GitHub, puis **Add New → Project** sur [vercel.com](https://vercel.com) et importer le dépôt (framework « Astro » détecté automatiquement).
2. Dans **Settings → Environment Variables**, définir les variables décrites dans `.env.example` :
   - `SITE_URL` : `https://www.connect-systemes.fr`
   - `OAUTH_GITHUB_CLIENT_ID` / `OAUTH_GITHUB_CLIENT_SECRET` (voir ci-dessous)
   - `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (optionnel, voir ci-dessous)
3. Dans **Settings → Domains**, ajouter `connect-systemes.fr` et `www.connect-systemes.fr`, puis modifier les DNS chez le registraire comme indiqué par Vercel. Le certificat HTTPS est automatique.

> **Offre gratuite Vercel** : l'offre *Hobby* est réservée à un usage **non commercial**. Pour le site d'une entreprise, il faut
> l'offre *Pro* (20 $/mois), ou un hébergeur gratuit qui accepte l'usage commercial : **Netlify** ou **Cloudflare Pages**. Le site est
> compatible : il suffit de remplacer l'adaptateur `@astrojs/vercel` par `@astrojs/netlify` ou `@astrojs/cloudflare` dans
> `astro.config.mjs`. Le code des fonctions `/api/*` utilise les API web standard et reste inchangé.

### Activer la connexion à l'administration (`/admin`)

1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**
   - *Homepage URL* : `https://www.connect-systemes.fr`
   - *Authorization callback URL* : `https://www.connect-systemes.fr/api/callback`
2. Copier le *Client ID* et générer un *Client secret*, puis les renseigner dans Vercel (`OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`) et redéployer.
3. Chaque personne qui modifie le site doit avoir un compte GitHub avec accès en écriture au dépôt (**Settings → Collaborators**).

Le dépôt et la branche modifiés par le CMS sont détectés automatiquement sur Vercel. On peut les forcer avec `CMS_GITHUB_REPO` et `CMS_GITHUB_BRANCH`.

### Recevoir les messages du formulaire de contact

Le formulaire envoie les messages par e-mail via [Resend](https://resend.com) (offre gratuite : 3 000 e-mails par mois) :
créer un compte, vérifier le domaine `connect-systemes.fr`, puis définir `RESEND_API_KEY`, `CONTACT_TO_EMAIL`
(plusieurs adresses possibles, séparées par des virgules) et `CONTACT_FROM_EMAIL` (ex. `Site Connect Systèmes <site@connect-systemes.fr>`).
**Sans ces variables**, le formulaire reste utilisable : il ouvre la messagerie du visiteur avec le message pré-rempli.

## Maquette de démonstration sur un VPS (avant la vente)

Le mode démo ajoute une bannière « Maquette », interdit l'indexation (balise `noindex` + `robots.txt`) et désactive
l'envoi du formulaire. Le reste du site (pages, 3D, animations) fonctionne normalement.

```bash
# Sur le VPS (Node.js 22+) :
git clone <dépôt> site && cd site && git checkout claude/funny-knuth-u7uym0
npm ci
DEMO_AUTHOR="Prénom Nom" npm run build:demo
sudo mkdir -p /var/www/maquette && sudo cp -r .vercel/output/static/. /var/www/maquette/

# Mot de passe d'accès (identifiant : client)
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-maquette client
```

Configuration nginx (`/etc/nginx/sites-available/maquette`, puis lien dans `sites-enabled` et `sudo nginx -s reload`) :

```nginx
server {
    server_name maquette.votre-domaine.fr;
    root /var/www/maquette;
    index index.html;

    auth_basic "Maquette privée";
    auth_basic_user_file /etc/nginx/.htpasswd-maquette;
    add_header X-Robots-Tag "noindex, nofollow" always;

    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }
    error_page 404 /404.html;
}
```

Activer le HTTPS : `sudo certbot --nginx -d maquette.votre-domaine.fr`.

## Guide d'édition (pour l'équipe Connect Systèmes)

Se rendre sur `https://www.connect-systemes.fr/admin`, puis cliquer sur **Se connecter avec GitHub**.

| Je veux… | Menu |
|---|---|
| Modifier une gamme, ajouter une photo | **Gammes de produits** |
| Mettre en ligne un catalogue PDF | **Documentation → Nouveau document** (sans fichier, le document est proposé « sur demande ») |
| Publier une actualité | **Actualités** (bon pour le référencement) |
| Changer un texte de l'accueil, des services… | **Pages** |
| Changer téléphone, adresse, partenaires, couleurs | **Réglages du site** |

Chaque fiche comporte un bloc **Référencement (SEO)** facultatif : titre et description pour Google (longueurs limitées automatiquement),
image de partage, et possibilité de masquer la page des moteurs de recherche.

## Contenus à valider avec le client

L'ancien site n'était pas accessible depuis l'environnement de développement. Les contenus ont été reconstitués à partir des
informations publiques du site et des annuaires professionnels :

- **Repris du site existant** : accroche « une gamme complète de produits et de services pour la maîtrise de vos connexions électriques »,
  les 5 axes (cosses et connecteurs adaptés, conducteurs performants, protections mécaniques et électriques, accessoires de faisceaux
  pour l'identification, analyse de coupe et sertissage), gammes (connectique STOCKO CONTACT / WIELAND, gaines thermorétractables,
  tresses métalliques, fils émaillés, tôlerie industrielle), secteurs (électroménager, chauffage, automobile, industrie, électronique,
  multimédia), coordonnées, informations légales.
- **Rédigés pour la proposition, à relire** : textes détaillés des gammes et services, repères historiques, engagements.
- **Logo** : reproduction vectorielle du logo fourni (`public/logo.svg`, données dans `src/components/logo/logo-data.ts`). Le monogramme a été
  ajusté sur l'original (97 % de recouvrement pixel) et les lettrages redessinés lettre par lettre. Dans l'en-tête, les mêmes éléments sont
  disposés à l'horizontale (pastille bleu ciel du monogramme + CONNECT / SYSTEMES), la composition carrée d'origine étant utilisée pour
  l'image de partage, la page « L'entreprise » et les résultats Google. Si le client dispose du fichier vectoriel original (AI, EPS, SVG, PDF),
  il suffit de remplacer `public/logo.svg`.
- **Couleurs** : reprises du logo, ajustables dans **Réglages du site → Couleurs** (couleur principale, secondaire et sombre).
- **Documents PDF** : 3 catalogues ont été identifiés sur l'ancien site (VERSAFIT RAYCHEM, STO-FIT et cosses en vrac STOCKO).
  Ils s'affichent « sur demande » tant que les fichiers ne sont pas importés. Depuis un poste ayant accès à l'ancien site, lancer :
  ```bash
  npm run import-docs   # télécharge les PDF dans public/documents et met à jour les fiches
  ```
  Les anciennes adresses des PDF redirigent vers `/documentation/` (voir `astro.config.mjs`).

## Structure

```
src/
  content/            Gammes (.md), documents (.yml), actualités (.md), pages légales (.md)
  data/               Réglages du site et textes des pages (.json)
  components/         Logo, en-tête, pied de page, cartes, illustrations SVG, SEO
  components/home/    Bandeau d'accueil avec la scène 3D
  scripts/            Scène Three.js, micro-interactions
  pages/              Pages du site, /admin, /api (auth GitHub, contact), robots.txt, llms.txt, RSS
  lib/                Schémas de validation, configuration du CMS
public/               Favicon, image de partage, uploads du CMS, documents PDF
scripts/              Copie de Decap CMS au build, import des PDF de l'ancien site
```
