import { createServerFn } from '@tanstack/react-start';
import { submissionSchema, toN8nPayload } from './trial-request';
import { deliverToN8n } from './n8n-delivery';
import { z } from 'zod';

const registerSchema = z.union([
  z.object({ status: z.literal('created'), id: z.uuid(), prioridade: z.enum(['quente', 'morno', 'frio']), created_at: z.string() }),
  z.object({ status: z.literal('duplicate') }),
]);

// Public lead intake: revalidates input; priority and 30-day duplicate rule run in the database function.
export const submitTrialRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const parsed = submissionSchema.safeParse(data);
    if (!parsed.success) return { status: 'error' as const, message: parsed.error.issues[0]?.message ?? 'Revise os dados e tente novamente.' };
    const input = parsed.data;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await supabaseAdmin.rpc('register_lead', {
      p_nome: input.nome, p_email: input.email, p_whatsapp: input.whatsapp, p_unidade: input.unidade,
      p_modalidade: input.modalidade, p_prazo: input.inicio, p_consentimento: input.consentimento,
    });
    if (error) { console.error('register_lead failed', error.code); return { status: 'error' as const, message: 'Não foi possível registrar sua solicitação agora. Seus dados foram mantidos; tente novamente.' }; }
    const reg = registerSchema.safeParse(result);
    if (!reg.success) return { status: 'error' as const, message: 'Não foi possível registrar sua solicitação agora. Tente novamente.' };
    if (reg.data.status === 'duplicate') return { status: 'duplicate' as const, message: 'Já recebemos uma solicitação com este e-mail ou WhatsApp nos últimos 30 dias. Nossa equipe entrará em contato em breve.' };
    const lead = reg.data;
    // Optional external webhook (Make/n8n). Only runs when N8N_WEBHOOK_URL is configured; result is logged as an event.
    const webhook = process.env['N8N_WEBHOOK_URL'];
    if (webhook) {
      const delivery = await deliverToN8n(webhook, { ...toN8nPayload(input), id: lead.id, prioridade: lead.prioridade, data_solicitacao: lead.created_at }, lead.id);
      await supabaseAdmin.from('integration_events').insert({ lead_id: lead.id, destino: 'webhook', status: delivery.accepted ? 'enviado' : 'falhou', detalhe: delivery.accepted ? 'HTTP 2xx' : 'Sem confirmação 2xx' });
    }
    return { status: 'success' as const, unidade: input.unidade, modalidade: input.modalidade, prioridade: lead.prioridade };
  });
