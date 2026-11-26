import { createServerFn } from '@tanstack/react-start';
import { submissionSchema, toN8nPayload } from './trial-request';
import { deliverToN8n } from './n8n-delivery';
import { z } from 'zod';

const claimSchema = z.union([
  z.object({ status: z.literal('claimed'), id: z.uuid(), created_at: z.string() }),
  z.object({ status: z.literal('duplicate') }),
]);

export const submitTrialRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const parsed = submissionSchema.safeParse(data);
    if (!parsed.success) return { status: 'error' as const, message: parsed.error.issues[0]?.message ?? 'Revise os dados e tente novamente.' };
    const input = parsed.data;
    const webhook = process.env['N8N_WEBHOOK_URL'];
    if (!webhook) return { status: 'error' as const, message: 'O envio está indisponível porque a integração com o n8n ainda não foi configurada. Seus dados foram mantidos; tente novamente após a configuração.' };
    // Public lead intake: validated, atomic reservation only; never expose stored PII or retry tokens.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const payload = toN8nPayload(input);
    const { data: reservation, error } = await supabaseAdmin.rpc('claim_n8n_submission', { p_payload: payload, p_token: input.requestToken });
    if (error) return { status: 'error' as const, message: 'Não foi possível preparar o envio. Seus dados foram mantidos; tente novamente.' };
    const claim = claimSchema.safeParse(reservation);
    if (!claim.success) return { status: 'error' as const, message: 'Não foi possível preparar o envio. Tente novamente.' };
    if (claim.data.status === 'duplicate') return { status: 'duplicate' as const, message: 'Já existe uma solicitação recebida ou em processamento para este e-mail ou WhatsApp. Aguarde o atendimento da equipe.' };
    const row = claim.data;
    const delivery = await deliverToN8n(webhook, { ...payload, id: row.id, data_solicitacao: row.created_at }, row.id);
    const { error: statusError } = await supabaseAdmin.from('n8n_submissions').update({ status: delivery.accepted ? 'delivered' : 'failed' }).eq('id', row.id).eq('retry_token', input.requestToken);
    if (!delivery.accepted) return { status: 'error' as const, message: delivery.message };
    if (statusError) {
      // n8n has accepted it; do not encourage creating a second card due to local bookkeeping failure.
      return { status: 'pending' as const, message: 'O n8n recebeu o pedido, mas houve uma falha ao atualizar o controle do envio. Aguarde a equipe antes de reenviar.' };
    }
    return { status: 'success' as const, unidade: input.unidade, modalidade: input.modalidade };
  });
