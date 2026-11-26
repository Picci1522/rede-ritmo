import { z } from 'zod';

export const units = [{ value: 'centro', label: 'Centro' }, { value: 'estreito', label: 'Estreito' }, { value: 'sao-jose', label: 'São José' }] as const;
export const modalities = [{ value: 'musculacao', label: 'Musculação' }, { value: 'funcional', label: 'Funcional' }, { value: 'pilates', label: 'Pilates' }, { value: 'danca', label: 'Dança' }] as const;
export const deadlines = [{ value: 'esta-semana', label: 'Quero começar nesta semana' }, { value: 'este-mes', label: 'Quero começar neste mês' }, { value: 'pesquisando', label: 'Ainda estou pesquisando' }] as const;
export function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '');
  return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? digits : `55${digits}`;
}
export function formatWhatsapp(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length < 3) return digits;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length > 10 ? 7 : 6)}${digits.length > 6 ? '-' + digits.slice(digits.length > 10 ? 7 : 6) : ''}`;
}
export const trialSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome completo.').max(100, 'Informe seu nome completo.').transform(v => v.replace(/\s+/g, ' ')),
  email: z.string().trim().max(255, 'Informe um e-mail válido.').email('Informe um e-mail válido.').transform(v => v.toLowerCase()),
  whatsapp: z.string().max(25, 'Informe um WhatsApp válido com DDD.').transform(normalizeWhatsapp).refine(v => /^55[1-9][0-9](?:9[0-9]{8}|[2-9][0-9]{7})$/.test(v), 'Informe um WhatsApp válido com DDD.'),
  unidade: z.enum(['centro', 'estreito', 'sao-jose'], { error: 'Selecione uma unidade.' }),
  modalidade: z.enum(['musculacao', 'funcional', 'pilates', 'danca'], { error: 'Selecione uma modalidade.' }),
  inicio: z.enum(['esta-semana', 'este-mes', 'pesquisando'], { error: 'Informe quando pretende começar.' }),
  consentimento: z.boolean().refine(v => v, 'É necessário autorizar o contato para continuar.'),
  website: z.string().max(0, 'Não foi possível validar sua solicitação. Atualize a página e tente novamente.').default(''),
});
export type TrialRequest = z.output<typeof trialSchema>;
export function classifyDeadline(prazo: TrialRequest['inicio']) {
  return { 'esta-semana': 'quente', 'este-mes': 'morno', pesquisando: 'frio' }[prazo];
}

export const submissionSchema = trialSchema.extend({ requestToken: z.uuid() });
export function toN8nPayload(data: TrialRequest) {
  return { nome: data.nome, email: data.email, whatsapp: data.whatsapp, unidade: data.unidade, modalidade: data.modalidade, inicio: data.inicio, prazo: data.inicio, consentimento: data.consentimento };
}
