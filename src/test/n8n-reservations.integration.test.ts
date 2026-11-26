import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

// Explicit opt-in: real private database reservations, never calls n8n or Trello.
// Delete only the printed fixture id through the database tool after inspection.
describe.skipIf(process.env['N8N_DB_TESTS'] !== '1')('Reservas privadas n8n (não comprova entrega externa)', () => {
  const token = crypto.randomUUID();
  const payload = { nome: 'Pessoa Teste Reserva', email: 'teste-reserva-n8n@example.com', whatsapp: '5548999990102', unidade: 'centro', modalidade: 'funcional', inicio: 'esta-semana', prazo: 'esta-semana', consentimento: true };
  let id = '';
  const resultSchema = z.object({ status: z.string(), id: z.string().optional() });
  async function client() { return (await import('@/integrations/supabase/client.server')).supabaseAdmin; }
  async function claim(value = payload, retryToken = token) {
    const db = await client();
    const result = await db.rpc('claim_n8n_submission', { p_payload: value, p_token: retryToken });
    expect(result.error).toBeNull();
    return resultSchema.parse(result.data);
  }
  beforeAll(async () => {
    const initial = await claim();
    expect(initial.status).toBe('claimed');
    expect(initial.id).toBeTruthy();
    id = initial.id ?? '';
    console.info('Reserva fictícia para remover por id:', id);
  });
  it('bloqueia mesmo e-mail normalizado com outro WhatsApp', async () => {
    expect((await claim({ ...payload, whatsapp: '5548999990103' }, crypto.randomUUID())).status).toBe('duplicate');
  });
  it('bloqueia mesmo WhatsApp normalizado com outro e-mail', async () => {
    expect((await claim({ ...payload, email: 'teste-other-n8n@example.com' }, crypto.randomUUID())).status).toBe('duplicate');
  });
  it('bloqueia dois cliques concorrentes durante processamento', async () => {
    const results = await Promise.all([claim(), claim()]);
    expect(results.map(r => r.status)).toEqual(['duplicate', 'duplicate']);
  });
  it('permite repetir falha com o mesmo id sem criar outra reserva', async () => {
    const db = await client();
    expect((await db.from('n8n_submissions').update({ status: 'failed' }).eq('id', id)).error).toBeNull();
    const retry = await claim();
    expect(retry.status).toBe('claimed');
    expect(retry.id).toBe(id);
    const read = await db.from('n8n_submissions').select('id').eq('email', payload.email);
    expect(read.data).toEqual([{ id }]);
  });
});