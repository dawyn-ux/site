import { marked } from 'marked';
import {
  settingsSchema,
  homeSchema,
  simplePageSchema,
  servicesSchema,
  entrepriseSchema,
  contactSchema,
  typo,
} from './schemas';
import settingsJson from '../data/settings.json';
import accueilJson from '../data/pages/accueil.json';
import gammesJson from '../data/pages/gammes.json';
import servicesJson from '../data/pages/services.json';
import entrepriseJson from '../data/pages/entreprise.json';
import contactJson from '../data/pages/contact.json';
import documentationJson from '../data/pages/documentation.json';
import actualitesJson from '../data/pages/actualites.json';

// Les contenus modifiés dans le CMS sont validés au moment du build :
// une saisie invalide fait échouer le déploiement au lieu de casser le site en ligne.
function applyTypo(value: unknown): unknown {
  if (typeof value === 'string') return typo(value);
  if (Array.isArray(value)) return value.map(applyTypo);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, applyTypo(v)]));
  }
  return value;
}

function parse<T>(name: string, schema: { parse: (v: unknown) => T }, data: unknown): T {
  try {
    return applyTypo(schema.parse(data)) as T;
  } catch (error) {
    throw new Error(`Contenu invalide dans « ${name} » : ${(error as Error).message}`);
  }
}

export const settings = parse('Réglages du site', settingsSchema, settingsJson);

export const pages = {
  accueil: parse('Page Accueil', homeSchema, accueilJson),
  gammes: parse('Page Gammes', simplePageSchema, gammesJson),
  services: parse('Page Services', servicesSchema, servicesJson),
  entreprise: parse('Page Entreprise', entrepriseSchema, entrepriseJson),
  contact: parse('Page Contact', contactSchema, contactJson),
  documentation: parse('Page Documentation', simplePageSchema, documentationJson),
  actualites: parse('Page Actualités', simplePageSchema, actualitesJson),
};

/** Convertit un texte Markdown saisi dans le CMS en HTML. */
export function md(text: string | undefined): string {
  if (!text) return '';
  return marked.parse(text, { async: false, gfm: true, breaks: false }) as string;
}

/** Convertit du Markdown « en ligne » (sans paragraphe englobant). */
export function mdInline(text: string | undefined): string {
  if (!text) return '';
  return marked.parseInline(text, { async: false }) as string;
}

export const phoneHref = (phone: string) => `tel:+33${phone.replace(/\D/g, '').replace(/^0/, '')}`;

export const fullAddress = () =>
  `${settings.contact.street}, ${settings.contact.postal_code} ${settings.contact.city}`;

export const mapsUrl = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.legal_name}, ${fullAddress()}`)}`;

export const osmUrl = () =>
  `https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress())}`;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
