# Bounce Method

One-page site for the Bounce Method vertical jump program.

- `index.html` is the whole site (styles and script are inside it).
- `functions/api/lead.js` handles the lead form (honeypot, captcha check, saves the lead).

## Finish the form setup (one time, in Cloudflare)

The page works as soon as it's deployed, but the form needs three things before it can collect real leads.

### 1. Create the captcha (Cloudflare Turnstile)
1. Cloudflare dashboard > **Turnstile** > **Add widget**.
2. Add your domain, choose **Managed**, and create it.
3. Copy the **Site key** and put it in `index.html`, replacing `1x00000000000000000000AA` in the line with `class="cf-turnstile"`.
   (That value is Cloudflare's test key. It always passes, so replace it before you launch.)
4. Copy the **Secret key** for the next step.

### 2. Add the secret
Workers & Pages > your project > **Settings** > **Variables and Secrets** > add a secret named `TURNSTILE_SECRET` with the secret key.

### 3. Add somewhere to store leads
1. Workers & Pages > **KV** > **Create namespace** (call it `bounce-leads`).
2. Your project > **Settings** > **Bindings** > **Add** > **KV namespace**. Set the variable name to `LEADS` and pick `bounce-leads`.
3. Redeploy the project so it picks up the new settings.

Your leads show up in **Workers & Pages > KV > bounce-leads**. Each lead is one entry with first name, last name, email, phone, message, and the time it came in.

## Social links
TikTok and Instagram are set to `bounce.method`. The X (Twitter) link is hidden until you add your handle: in `index.html`, find the `YOUR_X_HANDLE` link, replace it, and delete the word `hidden`.
