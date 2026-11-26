import { describe, expect, it, vi } from 'vitest';
import { deliverToN8n } from '@/lib/n8n-delivery';
import { toN8nPayload, trialSchema } from '@/lib/trial-request';

const input = { nome: '  Pessoa   Teste ', email: ' TESTE@EXAMPLE.COM ', whatsapp: '(48) 99999-0001', unidade: 'centro', modalidade: 'funcional', inicio: 'esta-semana', consentimento: true };
describe('Contrato n8n (HTTP isolado, não comprova entrega externa)', () => {
  for (const status of [200, 201, 204, 299]) it(`confirma apenas HTTP ${status}`, async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    expect((await deliverToN8n('https://example.com/webhook/test', {}, 'test-id', request)).accepted).toBe(true);
  });
  for (const status of [301, 302, 400, 409, 429, 500, 503]) it(`não confirma HTTP ${status}`, async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    expect((await deliverToN8n('https://example.com/webhook/test', {}, 'test-id', request)).accepted).toBe(false);
  });
  it('falha de conexão permite tentar novamente', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(new Response(null, { status: 200 }));
    expect((await deliverToN8n('https://example.com/webhook/test', {}, 'same-id', request)).accepted).toBe(false);
    expect((await deliverToN8n('https://example.com/webhook/test', {}, 'same-id', request)).accepted).toBe(true);
  });
  it('envia POST JSON normalizado com início, sem classificação local', async () => {
    const payload = toN8nPayload(trialSchema.parse(input));
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    await deliverToN8n('https://example.com/webhook/test', payload, 'test-id', request);
    const options = request.mock.calls[0]?.[1];
    expect(options?.method).toBe('POST');
    expect(options?.redirect).toBe('manual');
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json', 'Idempotency-Key': 'test-id' });
    expect(JSON.parse(String(options?.body))).toEqual({ nome: 'Pessoa Teste', email: 'teste@example.com', whatsapp: '5548999990001', unidade: 'centro', modalidade: 'funcional', inicio: 'esta-semana', prazo: 'esta-semana', consentimento: true });
  });
  it('não envia para endereço sem HTTPS', async () => {
    const request = vi.fn<typeof fetch>();
    expect((await deliverToN8n('http://example.com', {}, 'test-id', request)).accepted).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});