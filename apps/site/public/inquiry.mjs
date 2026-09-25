/** Shared public request contract. Transport is supplied by the existing product owner. */
export const REQUEST_SCHEMA = 'prds.broker-fit-request.v1';
const text = (value, name, max) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\u0000-\u001F]/.test(value)) throw new Error(`Check ${name}; it is required and must be at most ${max} characters, on one line.`);
  return value.trim();
};
export function validateRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request.');
  const allowed = new Set(['company', 'name', 'email', 'offer', 'market', 'goal', 'consent', 'source']);
  if (Object.keys(input).some(key => !allowed.has(key))) throw new Error('Unexpected request field. Do not include a customer list.');
  const company = text(input.company, 'broker company', 120), name = text(input.name, 'your name', 100);
  const email = text(input.email, 'business email', 254);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('Enter a valid business email address.');
  if (!['fresh-filings', 'existing-list'].includes(input.offer)) throw new Error('Choose one evaluation type.');
  if (input.consent !== true) throw new Error('Confirm you are requesting a reply about this evaluation.');
  return { schema: REQUEST_SCHEMA, company, name, email, offer: input.offer,
    market: text(input.market, 'target market', 160), goal: text(input.goal, 'your goal', 300),
    consent: { purpose: 'reply-to-evaluation-request', accepted: true },
    source: ['direct', 'referral', 'field-notes', 'list-check', 'search', 'other'].includes(input.source) ? input.source : 'direct' };
}
export function validateIntake(config, now = Date.now()) {
  if (!config || config.status !== 'accepted') return null;
  const required = ['url', 'receipt', 'privacyURL', 'acceptedUntil'];
  if (required.some(key => typeof config[key] !== 'string' || !config[key])) throw new Error('Incomplete accepted intake configuration.');
  for (const key of ['url', 'receipt', 'privacyURL']) {
    const url = new URL(config[key]);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw new Error('Intake destinations require plain HTTPS URLs without credentials, fragments, or query strings.');
  }
  const expiry = Date.parse(config.acceptedUntil);
  if (!Number.isFinite(expiry) || expiry <= now) return null;
  return config;
}
export async function submitRequest(request, config, { fetcher = globalThis.fetch, now = Date.now(), requestId } = {}) {
  const accepted = validateIntake(config, now);
  if (!accepted) return { state: 'not-sent', reason: 'intake-unavailable' };
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) throw new Error('A persistent request identifier is required.');
  // Browser caller supplies the same identifier after an ambiguous response; never auto-retry.
  const payload = validateRequest(request);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetcher(accepted.url, { method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, body: JSON.stringify(payload) });
    if (!response.ok) return { state: response.status >= 500 ? 'unknown' : 'rejected', status: response.status };
    const result = await response.json();
    if (result?.schema !== 'prds.intake-receipt.v1' || result?.requestId !== requestId || result?.state !== 'received' || typeof result?.receiptId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(result.receiptId)) return { state: 'unknown' };
    return { state: 'received', receiptId: result.receiptId };
  } catch { return { state: 'unknown' }; }
  finally { clearTimeout(timer); }
}
