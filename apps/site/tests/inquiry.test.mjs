import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest, validateIntake, submitRequest } from '../public/inquiry.mjs';
const input = () => ({ company: 'Example Broker', name: 'Example Person', email: 'person@example.test', offer: 'existing-list', market: 'CO', goal: 'Remove duplicates', consent: true, source: 'referral' });
const now = Date.parse('2026-09-24T20:00:00Z');
const config = () => ({ status: 'accepted', url: 'https://example.test/intake', receipt: 'https://example.test/evidence', privacyURL: 'https://example.test/privacy', acceptedUntil: '2026-10-01T00:00:00Z' });
const id = 'test-request-123456789';
test('request normalized to bounded allowed fields and purpose-specific consent', () => {
  const r = validateRequest(input()); assert.equal(r.schema, 'prds.broker-fit-request.v1'); assert.equal(r.consent.purpose, 'reply-to-evaluation-request'); assert.equal(r.source, 'referral');
});
for (const [key, value] of [['consent', false], ['offer', 'loan'], ['email', 'a\nb@example.test'], ['company', 'x'.repeat(121)], ['goal', ''], ['name', '\0']]) {
  test(`rejects invalid ${key}`, () => assert.throws(() => validateRequest({ ...input(), [key]: value })));
}
test('unknown payload keys cannot leak customer data', () => assert.throws(() => validateRequest({ ...input(), customerList: 'private' }), /Unexpected/));
test('request source cannot become arbitrary tracking content', () => assert.equal(validateRequest({ ...input(), source: 'private@example.test' }).source, 'direct'));
test('unconfigured intake never invokes network', async () => {
  let calls = 0; const r = await submitRequest(input(), { status: 'not-connected' }, { now, requestId: id, fetcher: () => { calls++; } });
  assert.equal(r.state, 'not-sent'); assert.equal(calls, 0);
});
test('expired acceptance fails closed', () => assert.equal(validateIntake({ ...config(), acceptedUntil: '2026-09-01' }, now), null));
for (const url of ['http://example.test/intake', 'https://user:pass@example.test/intake', 'https://example.test/intake?key=x', 'https://example.test/intake#x']) test(`rejects unsafe intake URL ${url}`, () => assert.throws(() => validateIntake({ ...config(), url }, now)));
test('missing configuration evidence rejected', () => assert.throws(() => validateIntake({ status: 'accepted' }, now)));
test('idempotency identity is mandatory', async () => assert.rejects(submitRequest(input(), config(), { now, fetcher: () => { throw Error('must not reach'); } }), /identifier/));
test('success requires a correlated durable receipt', async () => {
  const result = await submitRequest(input(), config(), { now, requestId: id, fetcher: async (url, options) => {
    assert.equal(options.headers['Idempotency-Key'], id); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
    assert.equal(JSON.parse(options.body).company, 'Example Broker');
    return { ok: true, json: async () => ({ schema: 'prds.intake-receipt.v1', state: 'received', requestId: id, receiptId: 'receipt_12345678' }) };
  }}); assert.equal(result.state, 'received');
});
for (const data of [{}, { schema: 'prds.intake-receipt.v1', state: 'received', requestId: 'wrong', receiptId: 'receipt_12345678' }, { schema: 'prds.intake-receipt.v1', state: 'received', requestId: id, receiptId: '<script>' }]) {
  test('HTTP 200 without valid bound receipt is not success', async () => assert.equal((await submitRequest(input(), config(), { now, requestId: id, fetcher: async () => ({ ok: true, json: async () => data }) })).state, 'unknown'));
}
test('server error has uncertain delivery; no automatic retry', async () => {
  let calls = 0; const r = await submitRequest(input(), config(), { now, requestId: id, fetcher: async () => { calls++; return { ok: false, status: 503 }; } });
  assert.equal(r.state, 'unknown'); assert.equal(calls, 1);
});
test('client rejection remains distinct from receipt', async () => assert.equal((await submitRequest(input(), config(), { now, requestId: id, fetcher: async () => ({ ok: false, status: 422 }) })).state, 'rejected'));
test('network failure is uncertain and not retried', async () => assert.equal((await submitRequest(input(), config(), { now, requestId: id, fetcher: async () => { throw Error('network'); } })).state, 'unknown'));
