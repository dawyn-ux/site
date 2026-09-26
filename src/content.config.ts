import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { seoSchema, optionalString, optionalText, text } from './lib/schemas';

const gammes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gammes' }),
  schema: z.object({
    title: text,
    short_title: optionalText,
    order: z.coerce.number().default(99),
    illustration: z
      .enum(['connecteur', 'gaine', 'tresse', 'fil', 'faisceau', 'outillage', 'tolerie'])
      .default('connecteur'),
    summary: text,
    image: optionalString,
    image_alt: optionalString,
    brands: z.array(z.string()).nullish().transform((v) => v ?? []),
    applications: z.array(text).nullish().transform((v) => v ?? []),
    features: z
      .array(z.object({ title: text, text: text }))
      .nullish()
      .transform((v) => v ?? []),
    seo: seoSchema,
  }),
});

const actualites = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/actualites' }),
  schema: z.object({
    title: text,
    date: z.coerce.date(),
    summary: text,
    image: optionalString,
    image_alt: optionalString,
    draft: z.boolean().nullish().transform((v) => v ?? false),
    seo: seoSchema,
  }),
});

const documents = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/content/documents' }),
  schema: z.object({
    title: text,
    brand: optionalString,
    type: z.enum(['Catalogue', 'Fiche technique', 'Guide', 'Certificat', 'Autre']).default('Autre'),
    gamme: optionalString,
    description: optionalText,
    language: optionalString,
    file: optionalString,
    external_url: optionalString,
    // Adresse du fichier sur l'ancien site (utilisée par scripts/import-legacy-documents.mjs)
    legacy_url: optionalString,
    order: z.coerce.number().default(99),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    updated: z.coerce.date().nullish(),
    seo: seoSchema,
  }),
});

export const collections = { gammes, actualites, documents, legal };
