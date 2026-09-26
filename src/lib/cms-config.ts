/**
 * Configuration de Decap CMS (interface d'administration /admin).
 * Générée au build et servie sur /admin/config.yml (le JSON est du YAML valide).
 *
 * Chaque collection correspond à un dossier/fichier de contenu du dépôt :
 * une modification dans l'admin crée un commit sur GitHub, puis Vercel redéploie le site.
 */

type Field = Record<string, unknown>;

const seo: Field = {
  label: 'Référencement (SEO)',
  name: 'seo',
  widget: 'object',
  collapsed: true,
  required: false,
  hint: 'Optionnel : laisser vide pour utiliser automatiquement le titre et le résumé de la page.',
  fields: [
    {
      label: 'Titre pour Google',
      name: 'title',
      widget: 'string',
      required: false,
      hint: 'Idéalement 50 à 60 caractères, avec les mots-clés principaux au début.',
      pattern: ['^.{0,65}$', '65 caractères maximum'],
    },
    {
      label: 'Description pour Google',
      name: 'description',
      widget: 'text',
      required: false,
      hint: 'Idéalement 140 à 160 caractères : un résumé qui donne envie de cliquer.',
      pattern: ['^[\\s\\S]{0,170}$', '170 caractères maximum'],
    },
    {
      label: 'Image de partage (réseaux sociaux)',
      name: 'image',
      widget: 'image',
      required: false,
      hint: 'Format conseillé : 1200 × 630 px.',
    },
    {
      label: 'Masquer cette page des moteurs de recherche',
      name: 'noindex',
      widget: 'boolean',
      default: false,
      required: false,
    },
  ],
};

const link = (label: string, name: string): Field => ({
  label,
  name,
  widget: 'object',
  fields: [
    { label: 'Texte du bouton', name: 'label', widget: 'string' },
    { label: 'Lien (ex. /contact/)', name: 'url', widget: 'string' },
  ],
});

const sectionHead = (label: string, name: string): Field => ({
  label,
  name,
  widget: 'object',
  collapsed: true,
  fields: [
    { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
    { label: 'Titre', name: 'title', widget: 'string' },
    { label: 'Texte', name: 'text', widget: 'text' },
  ],
});

const pageIntro: Field[] = [
  { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
  { label: 'Titre de la page (H1)', name: 'title', widget: 'string', hint: 'Un seul titre principal par page : il est très important pour le référencement.' },
  { label: 'Introduction', name: 'intro', widget: 'text' },
];

const iconOptions = [
  { label: 'Électroménager', value: 'appliance' },
  { label: 'Flamme / chauffage', value: 'flame' },
  { label: 'Automobile', value: 'car' },
  { label: 'Usine / industrie', value: 'factory' },
  { label: 'Puce électronique', value: 'chip' },
  { label: 'Écran / multimédia', value: 'screen' },
  { label: 'Éclair', value: 'lightning' },
  { label: 'Microscope', value: 'microscope' },
  { label: 'Outil', value: 'tool' },
  { label: 'Boussole', value: 'compass' },
  { label: 'Colis', value: 'box' },
];

const illustrationOptions = [
  { label: 'Connecteur', value: 'connecteur' },
  { label: 'Gaine thermorétractable', value: 'gaine' },
  { label: 'Tresse métallique', value: 'tresse' },
  { label: 'Bobine de fil', value: 'fil' },
  { label: 'Faisceau repéré', value: 'faisceau' },
  { label: 'Pince à sertir', value: 'outillage' },
  { label: 'Pièce de tôlerie', value: 'tolerie' },
];

export function buildCmsConfig(opts: { repo: string; branch: string; siteUrl: string }) {
  return {
    backend: {
      name: 'github',
      repo: opts.repo,
      branch: opts.branch,
      base_url: opts.siteUrl,
      auth_endpoint: 'api/auth',
      squash_merges: true,
      commit_messages: {
        create: 'Contenu : création de « {{slug}} » ({{collection}})',
        update: 'Contenu : mise à jour de « {{slug}} » ({{collection}})',
        delete: 'Contenu : suppression de « {{slug}} » ({{collection}})',
        uploadMedia: 'Médias : ajout de « {{path}} »',
        deleteMedia: 'Médias : suppression de « {{path}} »',
      },
    },
    // En local : « npm run cms » puis http://localhost:4321/admin/
    local_backend: true,
    locale: 'fr',
    site_url: opts.siteUrl,
    display_url: opts.siteUrl,
    logo_url: '/logo-512.png',
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
    collections: [
      {
        name: 'gammes',
        label: 'Gammes de produits',
        label_singular: 'Gamme',
        description: 'Les familles de produits. Chaque gamme dispose de sa propre page (/gammes/…).',
        folder: 'src/content/gammes',
        create: true,
        slug: '{{short_title}}',
        identifier_field: 'title',
        summary: '{{order}} — {{title}}',
        sortable_fields: [{ field: 'order', label: 'Ordre', default_sort: 'asc' }, 'title'],
        preview_path: 'gammes/{{slug}}/',
        fields: [
          { label: 'Titre complet', name: 'title', widget: 'string', hint: 'Titre principal de la page de la gamme.' },
          { label: 'Titre court', name: 'short_title', widget: 'string', hint: 'Utilisé dans les menus, les cartes et pour l’adresse de la page.' },
          { label: 'Ordre d’affichage', name: 'order', widget: 'number', value_type: 'int', default: 10, min: 1 },
          { label: 'Illustration', name: 'illustration', widget: 'select', options: illustrationOptions, default: 'connecteur', hint: 'Utilisée si aucune photo n’est ajoutée.' },
          { label: 'Photo', name: 'image', widget: 'image', required: false, hint: 'Remplace l’illustration. Format paysage 4:3 conseillé.' },
          { label: 'Description de la photo', name: 'image_alt', widget: 'string', required: false, hint: 'Décrivez la photo pour les malvoyants et Google.' },
          { label: 'Résumé', name: 'summary', widget: 'text', hint: '1 à 2 phrases (affiché sur les cartes et sous le titre).', pattern: ['^[\\s\\S]{20,260}$', 'Entre 20 et 260 caractères'] },
          { label: 'Marques', name: 'brands', widget: 'list', required: false, allow_add: true, field: { label: 'Marque', name: 'brand', widget: 'string' } },
          { label: 'Applications', name: 'applications', widget: 'list', required: false, field: { label: 'Application', name: 'application', widget: 'string' } },
          {
            label: 'Points forts',
            name: 'features',
            widget: 'list',
            required: false,
            summary: '{{fields.title}}',
            fields: [
              { label: 'Titre', name: 'title', widget: 'string' },
              { label: 'Texte', name: 'text', widget: 'text' },
            ],
          },
          { label: 'Contenu de la page', name: 'body', widget: 'markdown', hint: 'Utilisez les intertitres (Titre 2) pour structurer le texte.' },
          seo,
        ],
      },
      {
        name: 'documents',
        label: 'Documentation',
        label_singular: 'Document',
        description: 'Catalogues et fiches techniques proposés au téléchargement (page Documentation et pages des gammes).',
        folder: 'src/content/documents',
        extension: 'yml',
        format: 'yml',
        create: true,
        slug: '{{title}}',
        summary: '{{brand}} — {{title}}',
        sortable_fields: [{ field: 'order', label: 'Ordre', default_sort: 'asc' }, 'title', 'brand'],
        media_folder: '/public/documents',
        public_folder: '/documents',
        fields: [
          { label: 'Titre', name: 'title', widget: 'string' },
          { label: 'Marque', name: 'brand', widget: 'string', required: false },
          {
            label: 'Type',
            name: 'type',
            widget: 'select',
            options: ['Catalogue', 'Fiche technique', 'Guide', 'Certificat', 'Autre'],
            default: 'Fiche technique',
          },
          {
            label: 'Gamme associée',
            name: 'gamme',
            widget: 'relation',
            collection: 'gammes',
            search_fields: ['title', 'short_title'],
            value_field: '{{slug}}',
            display_fields: ['short_title'],
            required: false,
          },
          { label: 'Description', name: 'description', widget: 'text', required: false },
          { label: 'Langue(s)', name: 'language', widget: 'string', required: false, hint: 'Ex. : FR, FR / EN' },
          { label: 'Fichier (PDF)', name: 'file', widget: 'file', required: false, hint: 'Sans fichier, le document est proposé « sur demande ».' },
          { label: 'Ou lien externe', name: 'external_url', widget: 'string', required: false, hint: 'Lien vers la fiche sur le site du fabricant (https://…).' },
          { label: 'Ordre d’affichage', name: 'order', widget: 'number', value_type: 'int', default: 10 },
          { label: 'Adresse sur l’ancien site', name: 'legacy_url', widget: 'hidden', required: false },
        ],
      },
      {
        name: 'actualites',
        label: 'Actualités',
        label_singular: 'Actualité',
        description: 'Publier régulièrement des actualités (nouveaux produits, salons…) améliore le référencement.',
        folder: 'src/content/actualites',
        create: true,
        slug: '{{year}}-{{month}}-{{slug}}',
        summary: '{{date | date("DD/MM/YYYY")}} — {{title}}',
        sortable_fields: [{ field: 'date', label: 'Date', default_sort: 'desc' }, 'title'],
        preview_path: 'actualites/{{slug}}/',
        fields: [
          { label: 'Titre', name: 'title', widget: 'string' },
          { label: 'Date de publication', name: 'date', widget: 'datetime', date_format: 'DD/MM/YYYY', time_format: false, format: 'YYYY-MM-DD' },
          { label: 'Résumé', name: 'summary', widget: 'text', pattern: ['^[\\s\\S]{20,260}$', 'Entre 20 et 260 caractères'] },
          { label: 'Image', name: 'image', widget: 'image', required: false },
          { label: 'Description de l’image', name: 'image_alt', widget: 'string', required: false },
          { label: 'Brouillon (non publié)', name: 'draft', widget: 'boolean', default: false, required: false },
          { label: 'Article', name: 'body', widget: 'markdown' },
          seo,
        ],
      },
      {
        name: 'pages',
        label: 'Pages',
        description: 'Textes des pages principales du site.',
        editor: { preview: false },
        files: [
          {
            name: 'accueil',
            label: 'Accueil',
            file: 'src/data/pages/accueil.json',
            fields: [
              {
                label: 'Bandeau principal',
                name: 'hero',
                widget: 'object',
                fields: [
                  { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
                  { label: 'Titre (H1)', name: 'title', widget: 'string' },
                  { label: 'Fin du titre (en couleur)', name: 'highlight', widget: 'string', required: false },
                  { label: 'Texte', name: 'text', widget: 'text' },
                  link('Bouton principal', 'primary_cta'),
                  link('Bouton secondaire', 'secondary_cta'),
                ],
              },
              { label: 'Bandeau défilant', name: 'marquee', widget: 'list', field: { label: 'Mot', name: 'item', widget: 'string' } },
              {
                label: 'Notre offre',
                name: 'expertise',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
                  { label: 'Titre', name: 'title', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                  {
                    label: 'Points',
                    name: 'items',
                    widget: 'list',
                    summary: '{{fields.title}}',
                    fields: [
                      { label: 'Titre', name: 'title', widget: 'string' },
                      { label: 'Texte', name: 'text', widget: 'text' },
                    ],
                  },
                ],
              },
              sectionHead('Section « Nos gammes »', 'gammes_section'),
              {
                label: 'Légende de la scène 3D',
                name: 'scene_section',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                ],
              },
              sectionHead('Section « Partenaires »', 'partners_section'),
              {
                label: 'Secteurs d’application',
                name: 'sectors',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Sur-titre', name: 'eyebrow', widget: 'string' },
                  { label: 'Titre', name: 'title', widget: 'string' },
                  {
                    label: 'Secteurs',
                    name: 'items',
                    widget: 'list',
                    summary: '{{fields.title}}',
                    fields: [
                      { label: 'Nom', name: 'title', widget: 'string' },
                      { label: 'Texte', name: 'text', widget: 'string' },
                      { label: 'Icône', name: 'icon', widget: 'select', options: iconOptions },
                    ],
                  },
                ],
              },
              {
                label: 'Chiffres clés',
                name: 'figures',
                widget: 'list',
                summary: '{{fields.value}} — {{fields.label}}',
                fields: [
                  { label: 'Valeur', name: 'value', widget: 'string', hint: 'Les nombres sont animés automatiquement.' },
                  { label: 'Légende', name: 'label', widget: 'string' },
                ],
              },
              {
                label: 'Appel à l’action (bas de page)',
                name: 'cta',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Titre', name: 'title', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                  link('Bouton', 'button'),
                ],
              },
              seo,
            ],
          },
          {
            name: 'gammes',
            label: 'Page « Nos gammes »',
            file: 'src/data/pages/gammes.json',
            fields: [...pageIntro, seo],
          },
          {
            name: 'services',
            label: 'Page « Services »',
            file: 'src/data/pages/services.json',
            fields: [
              ...pageIntro,
              {
                label: 'Services',
                name: 'services',
                widget: 'list',
                summary: '{{fields.title}}',
                fields: [
                  { label: 'Titre', name: 'title', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                  { label: 'Points clés', name: 'points', widget: 'list', required: false, field: { label: 'Point', name: 'point', widget: 'string' } },
                  { label: 'Icône', name: 'icon', widget: 'select', options: iconOptions },
                ],
              },
              {
                label: 'Méthode',
                name: 'process',
                widget: 'object',
                fields: [
                  { label: 'Titre', name: 'title', widget: 'string' },
                  {
                    label: 'Étapes',
                    name: 'steps',
                    widget: 'list',
                    summary: '{{fields.title}}',
                    fields: [
                      { label: 'Titre', name: 'title', widget: 'string' },
                      { label: 'Texte', name: 'text', widget: 'text' },
                    ],
                  },
                ],
              },
              seo,
            ],
          },
          {
            name: 'entreprise',
            label: 'Page « L’entreprise »',
            file: 'src/data/pages/entreprise.json',
            fields: [
              ...pageIntro,
              { label: 'Présentation', name: 'body', widget: 'markdown' },
              {
                label: 'Repères',
                name: 'timeline',
                widget: 'list',
                summary: '{{fields.year}} — {{fields.title}}',
                fields: [
                  { label: 'Année / étiquette', name: 'year', widget: 'string' },
                  { label: 'Titre', name: 'title', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                ],
              },
              {
                label: 'Engagements',
                name: 'values',
                widget: 'list',
                summary: '{{fields.title}}',
                fields: [
                  { label: 'Titre', name: 'title', widget: 'string' },
                  { label: 'Texte', name: 'text', widget: 'text' },
                ],
              },
              seo,
            ],
          },
          {
            name: 'documentation',
            label: 'Page « Documentation »',
            file: 'src/data/pages/documentation.json',
            fields: [...pageIntro, seo],
          },
          {
            name: 'actualites',
            label: 'Page « Actualités »',
            file: 'src/data/pages/actualites.json',
            fields: [...pageIntro, seo],
          },
          {
            name: 'contact',
            label: 'Page « Contact »',
            file: 'src/data/pages/contact.json',
            fields: [
              ...pageIntro,
              { label: 'Titre du formulaire', name: 'form_title', widget: 'string' },
              { label: 'Texte du formulaire', name: 'form_text', widget: 'text' },
              { label: 'Objets proposés', name: 'subjects', widget: 'list', field: { label: 'Objet', name: 'subject', widget: 'string' } },
              { label: 'Message de confirmation', name: 'success_message', widget: 'text' },
              seo,
            ],
          },
          {
            name: 'mentions-legales',
            label: 'Mentions légales',
            file: 'src/content/legal/mentions-legales.md',
            fields: [
              { label: 'Titre', name: 'title', widget: 'string' },
              { label: 'Mise à jour le', name: 'updated', widget: 'datetime', date_format: 'DD/MM/YYYY', time_format: false, format: 'YYYY-MM-DD', required: false },
              { label: 'Contenu', name: 'body', widget: 'markdown' },
              seo,
            ],
          },
          {
            name: 'confidentialite',
            label: 'Politique de confidentialité',
            file: 'src/content/legal/confidentialite.md',
            fields: [
              { label: 'Titre', name: 'title', widget: 'string' },
              { label: 'Mise à jour le', name: 'updated', widget: 'datetime', date_format: 'DD/MM/YYYY', time_format: false, format: 'YYYY-MM-DD', required: false },
              { label: 'Contenu', name: 'body', widget: 'markdown' },
              seo,
            ],
          },
        ],
      },
      {
        name: 'reglages',
        label: 'Réglages du site',
        editor: { preview: false },
        files: [
          {
            name: 'general',
            label: 'Coordonnées, partenaires, couleurs et SEO',
            file: 'src/data/settings.json',
            fields: [
              { label: 'Nom du site', name: 'site_name', widget: 'string' },
              { label: 'Raison sociale', name: 'legal_name', widget: 'string' },
              { label: 'Accroche', name: 'tagline', widget: 'string' },
              {
                label: 'Description par défaut (SEO)',
                name: 'description',
                widget: 'text',
                hint: 'Utilisée pour les pages sans description. 140 à 160 caractères.',
                pattern: ['^[\\s\\S]{50,230}$', 'Entre 50 et 230 caractères'],
              },
              {
                label: 'Coordonnées',
                name: 'contact',
                widget: 'object',
                fields: [
                  { label: 'Téléphone', name: 'phone', widget: 'string' },
                  { label: 'Fax', name: 'fax', widget: 'string', required: false },
                  { label: 'E-mail', name: 'email', widget: 'string', pattern: ['^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', 'Adresse e-mail invalide'] },
                  { label: 'Adresse', name: 'street', widget: 'string' },
                  { label: 'Code postal', name: 'postal_code', widget: 'string' },
                  { label: 'Ville', name: 'city', widget: 'string' },
                  { label: 'Région', name: 'region', widget: 'string', required: false },
                  { label: 'Horaires', name: 'hours', widget: 'string', required: false, hint: 'Ex. : Du lundi au vendredi, 8 h – 12 h / 13 h 30 – 17 h' },
                ],
              },
              {
                label: 'Informations légales',
                name: 'legal',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Forme juridique', name: 'form', widget: 'string', required: false },
                  { label: 'Capital', name: 'capital', widget: 'string', required: false },
                  { label: 'RCS', name: 'rcs', widget: 'string', required: false },
                  { label: 'SIRET', name: 'siret', widget: 'string', required: false },
                  { label: 'N° TVA', name: 'vat', widget: 'string', required: false },
                  { label: 'Année de création', name: 'founded', widget: 'number', value_type: 'int' },
                  { label: 'Directeur de la publication', name: 'publisher', widget: 'string', required: false },
                ],
              },
              {
                label: 'Fabricants partenaires',
                name: 'partners',
                widget: 'list',
                summary: '{{fields.name}}',
                fields: [
                  { label: 'Nom', name: 'name', widget: 'string' },
                  { label: 'Groupe', name: 'group', widget: 'string', required: false },
                  { label: 'Texte', name: 'text', widget: 'text' },
                  { label: 'Site internet', name: 'url', widget: 'string', required: false },
                ],
              },
              {
                label: 'Couleurs',
                name: 'theme',
                widget: 'object',
                collapsed: true,
                hint: 'Les couleurs de toute la charte (boutons, logo, 3D) en découlent automatiquement.',
                fields: [
                  { label: 'Couleur d’accent', name: 'accent', widget: 'color', allowInput: true },
                  { label: 'Couleur sombre (textes, fonds)', name: 'ink', widget: 'color', allowInput: true },
                ],
              },
              {
                label: 'Réseaux sociaux',
                name: 'social',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'LinkedIn', name: 'linkedin', widget: 'string', required: false },
                  { label: 'Facebook', name: 'facebook', widget: 'string', required: false },
                  { label: 'YouTube', name: 'youtube', widget: 'string', required: false },
                ],
              },
              {
                label: 'Référencement',
                name: 'seo',
                widget: 'object',
                collapsed: true,
                fields: [
                  { label: 'Image de partage par défaut', name: 'default_image', widget: 'image' },
                  { label: 'Code de vérification Google Search Console', name: 'google_site_verification', widget: 'string', required: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
