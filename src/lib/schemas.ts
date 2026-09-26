import { z } from 'astro/zod';

/**
 * Typographie française : espace fine insécable avant ? ! ; : et à l'intérieur des guillemets,
 * pour éviter qu'un signe se retrouve seul en début de ligne.
 */
export function typo(value: string): string {
  return value
    .replace(/ ([?!;:»])/g, '\u202F$1')
    .replace(/« /g, '«\u202F');
}

/** Applique la typographie française au texte d'un fragment HTML (hors balises). */
export function typoHtml(html: string): string {
  return html.replace(/>([^<]+)</g, (_, t: string) => `>${typo(t)}<`);
}

/** Texte affiché : applique la typographie française. */
export const text = z.string().transform(typo);

/** Champ texte optionnel : Decap CMS peut enregistrer "" ou null quand un champ est vidé. */
export const optionalString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

/** Texte affiché optionnel (typographie française appliquée). */
export const optionalText = optionalString.transform((v) => (v ? typo(v) : v));

export const seoSchema = z
  .object({
    title: optionalString,
    description: optionalString,
    image: optionalString,
    noindex: z.boolean().nullish(),
  })
  .nullish()
  .transform((v) => ({
    title: v?.title,
    description: v?.description,
    image: v?.image,
    noindex: v?.noindex ?? false,
  }));

const link = z.object({ label: z.string(), url: z.string() });
const titled = z.object({ title: z.string(), text: z.string() });
const stringList = z.array(z.string()).nullish().transform((v) => v ?? []);

export const settingsSchema = z.object({
  site_name: z.string(),
  legal_name: z.string(),
  tagline: z.string(),
  description: z.string(),
  contact: z.object({
    phone: z.string(),
    fax: optionalString,
    email: z.string(),
    street: z.string(),
    postal_code: z.string(),
    city: z.string(),
    region: optionalString,
    hours: optionalString,
  }),
  legal: z.object({
    form: optionalString,
    capital: optionalString,
    rcs: optionalString,
    siret: optionalString,
    vat: optionalString,
    founded: z.coerce.number(),
    publisher: optionalString,
  }),
  partners: z
    .array(
      z.object({
        name: z.string(),
        group: optionalString,
        text: z.string(),
        url: optionalString,
      }),
    )
    .nullish()
    .transform((v) => v ?? []),
  theme: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    ink: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  social: z
    .object({ linkedin: optionalString, facebook: optionalString, youtube: optionalString })
    .nullish()
    .transform((v) => ({ linkedin: v?.linkedin, facebook: v?.facebook, youtube: v?.youtube })),
  seo: z.object({
    default_image: z.string(),
    google_site_verification: optionalString,
  }),
});

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    highlight: optionalString,
    text: z.string(),
    primary_cta: link,
    secondary_cta: link,
  }),
  marquee: stringList,
  expertise: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.string(),
    items: z.array(titled),
  }),
  gammes_section: z.object({ eyebrow: z.string(), title: z.string(), text: z.string() }),
  scene_section: z.object({ eyebrow: z.string(), text: z.string() }),
  partners_section: z.object({ eyebrow: z.string(), title: z.string(), text: z.string() }),
  sectors: z.object({
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(z.object({ title: z.string(), text: z.string(), icon: z.string() })),
  }),
  figures: z.array(z.object({ value: z.string(), label: z.string() })),
  cta: z.object({ title: z.string(), text: z.string(), button: link }),
  seo: seoSchema,
});

export const simplePageSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  intro: z.string(),
  seo: seoSchema,
});

export const servicesSchema = simplePageSchema.extend({
  services: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
      points: stringList,
      icon: z.string(),
    }),
  ),
  process: z.object({
    title: z.string(),
    steps: z.array(titled),
  }),
});

export const entrepriseSchema = simplePageSchema.extend({
  body: z.string(),
  timeline: z.array(z.object({ year: z.string(), title: z.string(), text: z.string() })),
  values: z.array(titled),
});

export const contactSchema = simplePageSchema.extend({
  form_title: z.string(),
  form_text: z.string(),
  subjects: z.array(z.string()),
  success_message: z.string(),
});
