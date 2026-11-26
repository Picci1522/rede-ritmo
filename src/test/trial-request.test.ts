import { describe, expect, it } from 'vitest';
import { classifyDeadline, normalizeWhatsapp, trialSchema } from '@/lib/trial-request';
const valid = { nome: 'Pessoa Teste', email: 'teste@example.com', whatsapp: '(48) 99999-0001', unidade: 'centro', modalidade: 'musculacao', prazo: 'esta-semana', consentimento: true };
describe('Regras da campanha', () => {
 it('esta-semana é quente', () => expect(classifyDeadline('esta-semana')).toBe('quente'));
 it('este-mes é morno', () => expect(classifyDeadline('este-mes')).toBe('morno'));
 it('pesquisando é frio', () => expect(classifyDeadline('pesquisando')).toBe('frio'));
 it('e-mail inválido bloqueia', () => expect(trialSchema.safeParse({...valid, email: 'invalido'}).success).toBe(false));
 it('unidade ausente bloqueia', () => expect(trialSchema.safeParse({...valid, unidade: ''}).success).toBe(false));
 it('normaliza o WhatsApp para identificar duplicidade', () => expect(normalizeWhatsapp('(48) 99999-0001')).toBe(normalizeWhatsapp('+55 48 99999-0001')));
 for (const unidade of ['centro','estreito','sao-jose']) it(`associa corretamente ${unidade}`, () => expect(trialSchema.parse({...valid, unidade}).unidade).toBe(unidade));
 it('consentimento é obrigatório', () => expect(trialSchema.safeParse({...valid, consentimento: false}).success).toBe(false));
 it('nome tem ao menos 2 caracteres', () => expect(trialSchema.safeParse({...valid, nome: 'A'}).success).toBe(false));
 it('nome aceita até 100 caracteres', () => { expect(trialSchema.safeParse({...valid, nome: 'A'.repeat(100)}).success).toBe(true); expect(trialSchema.safeParse({...valid, nome: 'A'.repeat(101)}).success).toBe(false); });
 it('WhatsApp exige DDD', () => expect(trialSchema.safeParse({...valid, whatsapp: '99999-0001'}).success).toBe(false));
 it('modalidade é obrigatória', () => expect(trialSchema.safeParse({...valid, modalidade: ''}).success).toBe(false));
 it('prazo é obrigatório', () => expect(trialSchema.safeParse({...valid, prazo: ''}).success).toBe(false));
 it('ignora classificação manipulada', () => expect(trialSchema.parse({...valid, classificacao: 'frio'})).not.toHaveProperty('classificacao'));
});
