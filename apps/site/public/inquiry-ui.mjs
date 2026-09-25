import { validateRequest, validateIntake, submitRequest } from './inquiry.mjs';
const byId = id => document.getElementById(id);
const form = byId('request-form'), status = byId('request-status'), output = byId('request-draft'), submit = byId('send-request');
// Configuration is embedded as HTML data, not fetched from an untrusted remote endpoint.
const config = JSON.parse(form.dataset.intake);
let requestId = '', lastFingerprint = '', busy = false, finished = false;
function read() {
  return { company: byId('company').value, name: byId('name').value, email: byId('email').value,
    offer: byId('offer').value, market: byId('market').value, goal: byId('goal').value,
    consent: byId('consent').checked, source: byId('source').value };
}
form.addEventListener('submit', event => event.preventDefault());
byId('prepare-request').addEventListener('click', () => {
  output.textContent = '';
  try {
    const request = validateRequest(read());
    output.textContent = `PRDS evaluation request — NOT SENT\nCompany: ${request.company}\nContact: ${request.name}\nEmail: ${request.email}\nEvaluation: ${request.offer}\nTarget market: ${request.market}\nGoal: ${request.goal}\nHeard about PRDS: ${request.source}\nPermission: reply about this request only.\nDo not attach customer lists or financial documents to this draft.`;
    status.textContent = 'Draft prepared locally, not submitted. Nothing has been sent or saved by this page.';
  } catch (error) { status.textContent = error.message; }
});
let enabled = false;
try { enabled = Boolean(validateIntake(config)); } catch { /* fail closed */ }
submit.hidden = !enabled;
if (enabled) submit.addEventListener('click', async () => {
  if (busy || finished) return;
  try {
    const request = read(); validateRequest(request);
    const fingerprint = JSON.stringify(request);
    if (fingerprint !== lastFingerprint) { requestId = crypto.randomUUID(); lastFingerprint = fingerprint; }
    busy = true; submit.disabled = true; status.textContent = 'Sending your request. Do not close this page.';
    const result = await submitRequest(request, config, { requestId });
    if (result.state === 'received') { finished = true; output.textContent = ''; form.reset(); status.textContent = `Request received. Receipt: ${result.receiptId}. This is not a purchase or an accepted pilot.`; }
    else if (result.state === 'unknown') { finished = true; status.textContent = `Delivery is uncertain; do not submit again. Keep request reference ${requestId} for reconciliation. No purchase was made.`; }
    else if (result.state === 'not-sent') status.textContent = 'Intake is unavailable. Your request was not sent.';
    else status.textContent = 'The endpoint rejected this request. No receipt was confirmed. Check your entries before retrying.';
  } catch (error) { status.textContent = error.message; }
  finally { busy = false; submit.disabled = finished; }
});
byId('clear-request').addEventListener('click', () => { form.reset(); output.textContent = ''; status.textContent = 'Fields cleared locally. Clearing this page does not delete a request already sent to an intake service.'; });
window.addEventListener('pagehide', () => { form.reset(); output.textContent = ''; });
