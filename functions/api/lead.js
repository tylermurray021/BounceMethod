// Cloudflare Pages Function: receives the lead form at POST /api/lead
//
// Needs (set in Cloudflare, see README.md):
//   TURNSTILE_SECRET  - secret key from your Turnstile widget (Pages > Settings > Variables and Secrets)
//   LEADS             - a KV namespace binding where leads are stored (Pages > Settings > Bindings)
//   ZEROBOUNCE_API_KEY - optional secret; when set, every email is checked with ZeroBounce first

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const clean = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);

// Google Form that feeds the "Form Responses 1" tab of the Bounce Method Leads sheet.
// The form has 2 pages (First name, then Email/Phone/Message), so pageHistory lists both.
// If the form's questions change, these entry numbers must be updated to match.
const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSe2_2OUP_DWgvD3eAdp4dT7JYXwx9IzTzlkO3j3N1rMwBvVOA/formResponse';

const sendToGoogleSheet = (lead) =>
  fetch(GOOGLE_FORM_URL, {
    method: 'POST',
    body: new URLSearchParams({
      'entry.1373570091': `${lead.first_name} ${lead.last_name}`.trim(), // "First name" (full name)
      'entry.164044029': lead.email, // "Email"
      'entry.1762524709': lead.phone, // "Phone #"
      'entry.289211120': lead.message, // "Message"
      pageHistory: '0,1',
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => {}); // the lead is already saved in KV, so a Google hiccup never loses it

export async function onRequestPost({ request, env, waitUntil }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }

  // Honeypot: real visitors leave this empty. Pretend success so bots learn nothing.
  if (clean(form.get('website'), 200) !== '') {
    return json({ ok: true });
  }

  const lead = {
    first_name: clean(form.get('first_name'), 60),
    last_name: clean(form.get('last_name'), 60),
    email: clean(form.get('email'), 120).toLowerCase(),
    phone: clean(form.get('phone'), 30),
    message: String(form.get('message') ?? '').trim().slice(0, 1000),
  };

  if (!lead.first_name || !lead.last_name) return json({ error: 'Please enter your first and last name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (lead.phone.replace(/\D/g, '').length < 7) return json({ error: 'Please enter a valid phone number.' }, 400);

  // Captcha: verify the Turnstile token with Cloudflare.
  const token = form.get('cf-turnstile-response');
  if (!token) return json({ error: 'Please complete the captcha.' }, 400);

  if (!env.TURNSTILE_SECRET) return json({ error: 'Form is not fully set up yet.' }, 500);

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: String(token),
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));

  if (!verify.success) return json({ error: 'Captcha failed. Please try again.' }, 400);

  // Email check with ZeroBounce (only runs once ZEROBOUNCE_API_KEY is set in Cloudflare).
  // Bad addresses are rejected. If ZeroBounce is slow, down, or out of credits, we let the lead through
  // so a vendor problem never costs you a real lead.
  let emailStatus = 'not_checked';
  if (env.ZEROBOUNCE_API_KEY) {
    try {
      const url =
        'https://api.zerobounce.net/v2/validate' +
        `?api_key=${encodeURIComponent(env.ZEROBOUNCE_API_KEY)}` +
        `&email=${encodeURIComponent(lead.email)}` +
        `&ip_address=${encodeURIComponent(request.headers.get('CF-Connecting-IP') || '')}` +
        '&timeout=5';
      const zb = await fetch(url, { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
      emailStatus = typeof zb.status === 'string' ? zb.status : 'unchecked';
    } catch {
      emailStatus = 'check_failed';
    }
    if (['invalid', 'spamtrap', 'abuse', 'do_not_mail'].includes(emailStatus)) {
      return json({ error: "That email address doesn't look right. Please check it and try again." }, 400);
    }
  }

  // Save the lead.
  if (!env.LEADS) return json({ error: 'Form is not fully set up yet.' }, 500);

  const id = `lead:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
  await env.LEADS.put(
    id,
    JSON.stringify({ ...lead, email_check: emailStatus, received_at: new Date().toISOString() })
  );

  // Also copy it into the Google Sheet (runs after the visitor gets their "You're in").
  waitUntil(sendToGoogleSheet(lead));

  return json({ ok: true });
}

// Anything other than POST gets a clear answer instead of a confusing error.
export const onRequest = () => json({ error: 'Method not allowed.' }, 405);
