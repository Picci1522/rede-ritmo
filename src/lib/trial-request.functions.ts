import { createServerFn } from '@tanstack/react-start';
import { trialSchema } from './trial-request';

export const submitTrialRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => trialSchema.parse(input))
  .handler(async ({ data }) => {
    // Public lead intake: validated, insert-only privileged operation. Never exposes stored PII.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin.from('trial_requests').insert(data).select('id, created_at, classificacao').single();
    if (error?.code === '23505') return { status: 'duplicate' as const, message: 'Já existe uma solicitação para este WhatsApp. Não é necessário enviar novamente; aguarde o atendimento da equipe.' };
    if (error || !row) return { status: 'error' as const, message: 'Não foi possível registrar sua solicitação. Seus dados foram mantidos. Tente novamente.' };
    const webhook = process.env['RECEPTION_WEBHOOK_URL'];
    if (!webhook) return { status: 'pending' as const, message: 'Seu pedido foi registrado, mas o encaminhamento à recepção ainda depende da configuração da integração. Sua aula não está agendada. Não é necessário reenviar.' };
    try {
      const target = new URL(webhook);
      if (target.protocol !== 'https:' || target.username || target.password) throw new Error('Invalid integration configuration');
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Idempotency-Key': row.id };
      const token = process.env['RECEPTION_WEBHOOK_TOKEN'];
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(target, { method: 'POST', headers, redirect: 'error', body: JSON.stringify({ ...data, classificacao: row.classificacao, data_solicitacao: row.created_at, id: row.id }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Integration did not accept request');
      const { error: updateError } = await supabaseAdmin.from('trial_requests').update({ integration_status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', row.id);
      if (updateError) throw new Error('Delivery status could not be persisted');
      return { status: 'success' as const, unidade: data.unidade, modalidade: data.modalidade };
    } catch {
      await supabaseAdmin.from('trial_requests').update({ integration_status: 'failed' }).eq('id', row.id);
      return { status: 'pending' as const, message: 'Seu pedido foi registrado, mas não conseguimos confirmar o recebimento pela recepção. Sua aula não está agendada. Não é necessário reenviar.' };
    }
  });
