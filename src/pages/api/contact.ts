import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } from 'astro:env/server';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

/**
 * Réception du formulaire de contact.
 * Envoi par e-mail via Resend (https://resend.com, offre gratuite) si RESEND_API_KEY et
 * CONTACT_TO_EMAIL sont définies ; sinon le navigateur ouvre la messagerie du visiteur.
 */
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  // Piège à robots : champ invisible qui doit rester vide
  if (clean(form.get('website'), 200)) return json({ ok: true });

  const data = {
    name: clean(form.get('name'), 120),
    company: clean(form.get('company'), 160),
    email: clean(form.get('email'), 160),
    phone: clean(form.get('phone'), 40),
    subject: clean(form.get('subject'), 120) || 'Demande de contact',
    message: clean(form.get('message'), 5000),
    consent: form.get('consent'),
  };

  const errors: Record<string, string> = {};
  if (!data.name) errors.name = 'Nom requis.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'E-mail invalide.';
  if (data.message.length < 10) errors.message = 'Message trop court.';
  if (!data.consent) errors.consent = 'Consentement requis.';
  if (Object.keys(errors).length) return json({ error: 'Formulaire incomplet.', errors }, 400);

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    return json({ error: "L'envoi d'e-mails n'est pas configuré." }, 501);
  }

  const lines = [
    'Nouveau message depuis le site internet',
    '',
    `Objet : ${data.subject}`,
    `Nom : ${data.name}`,
    ...(data.company ? [`Société : ${data.company}`] : []),
    `E-mail : ${data.email}`,
    ...(data.phone ? [`Téléphone : ${data.phone}`] : []),
    '',
    data.message,
  ];
  const text = lines.join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL || 'Site Connect Systèmes <onboarding@resend.dev>',
        to: CONTACT_TO_EMAIL.split(',').map((s) => s.trim()),
        reply_to: data.email,
        subject: `[Site] ${data.subject} — ${data.name}${data.company ? ` (${data.company})` : ''}`,
        text,
      }),
    });
    if (!res.ok) return json({ error: "L'envoi a échoué." }, 502);
    return json({ ok: true });
  } catch {
    return json({ error: "L'envoi a échoué." }, 502);
  }
};

export const ALL: APIRoute = () => json({ error: 'Méthode non autorisée.' }, 405);
