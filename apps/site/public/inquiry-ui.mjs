import { makePendingReference, validatePendingReference, validateRequest, validateIntake, submitRequest } from './inquiry.mjs';
const byId = id => document.getElementById(id);
const form = byId('request-form'), status = byId('request-status'), output = byId('request-draft'), submit = byId('send-request');
// Configuration is embedded as HTML data, not fetched from an untrusted remote endpoint.
const config = JSON.parse(form.dataset.intake);
const PENDING_KEY = 'prds.pending-inquiry.v1';
let requestId = '', lastFingerprint = '', busy = false, finished = false;
function read() {
  return { company: byId('company').value, name: byId('name').value, email: byId('email').value,
    offer: byId('offer').value, market: byId('market').value, goal: byId('goal').value,
    consent: byId('consent').checked, source: byId('source').value };
}
function reconciliationLink(reference) {
  let link = byId('request-reconcile');
  if (!link) {
    link = document.createElement('a'); link.id = 'request-reconcile'; link.rel = 'noopener noreferrer';
    status.insertAdjacentElement('afterend', link);
  }
  link.href = reference.reconcileURL; link.textContent = 'Open the receiving service’s reconciliation page'; link.hidden = false;
}
function loadPending() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? validatePendingReference(JSON.parse(raw), config) : null;
  } catch { return null; }
}
function storePending(id) {
  const reference = makePendingReference(id, config);
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(reference));
  return reference;
}
function clearPending() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* no persistence to clear */ }
}
function showPending(reference, message = 'A previous submission may be unresolved.') {
  requestId = reference.requestId; finished = true; submit.disabled = true;
  status.textContent = `${message} Do not submit again. Request reference: ${reference.requestId}. No purchase was made.`;
  reconciliationLink(reference);
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
if (enabled) {
  const prior = loadPending();
  if (prior) showPending(prior);
  submit.addEventListener('click', async () => {
    if (busy || finished) return;
    try {
      const request = read(); validateRequest(request);
      const fingerprint = JSON.stringify(request);
      if (fingerprint !== lastFingerprint) { requestId = crypto.randomUUID(); lastFingerprint = fingerprint; }
      // Fail closed if this tab cannot preserve the opaque reconciliation key before network activity.
      const pending = storePending(requestId);
      busy = true; submit.disabled = true; status.textContent = `Sending your request. Request reference: ${requestId}. Do not close this page.`;
      const result = await submitRequest(request, config, { requestId });
      if (result.state === 'received') {
        finished = true; clearPending(); output.textContent = ''; form.reset();
        status.textContent = `Request received. Receipt: ${result.receiptId}. This is not a purchase or an accepted pilot.`;
      } else if (result.state === 'unknown') showPending(pending, 'Delivery is uncertain.');
      else if (result.state === 'not-sent') { clearPending(); status.textContent = 'Intake is unavailable. Your request was not sent.'; }
      else { clearPending(); status.textContent = 'The endpoint rejected this request. No receipt was confirmed. Check your entries before retrying.'; }
    } catch (error) { status.textContent = `${error.message} Your request was not sent by this attempt.`; }
    finally { busy = false; submit.disabled = finished; }
  });
}
byId('clear-request').addEventListener('click', () => {
  form.reset(); output.textContent = '';
  const pending = enabled ? loadPending() : null;
  if (pending) showPending(pending, 'Fields cleared, but a previous submission may still be unresolved.');
  else status.textContent = 'Fields cleared locally. Clearing this page does not delete a request already sent to an intake service.';
});
window.addEventListener('pagehide', () => { form.reset(); output.textContent = ''; });
