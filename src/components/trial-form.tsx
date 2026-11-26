import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

interface TrialFormProps {
  unit: string;
  onUnitChange: (value: string) => void;
}

const CLASSIFICACAO_MAP = {
  'esta-semana': { valor: 'quente', rotulo: 'QUENTE', badge: 'bg-[#FF6B2C] text-[#191817]' },
  'este-mes': { valor: 'morno', rotulo: 'MORNO', badge: 'bg-amber-500 text-[#191817]' },
  pesquisando: { valor: 'frio', rotulo: 'FRIO', badge: 'bg-blue-500 text-white' },
} as const;

const UNIDADE_LABELS: Record<string, string> = {
  centro: 'Centro',
  estreito: 'Estreito',
  'sao-jose': 'São José',
};

const MODALIDADE_LABELS: Record<string, string> = {
  musculacao: 'Musculação',
  funcional: 'Funcional',
  pilates: 'Pilates',
  danca: 'Dança',
};

function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits;
}

function formatWhatsapp(raw: string): string {
  const digits = normalizeWhatsapp(raw).slice(0, 11);
  if (digits.length > 6) {
    const split = digits.length === 11 ? 7 : 6;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return digits;
}

export function TrialForm({ unit, onUnitChange }: TrialFormProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [prazo, setPrazo] = useState('');
  const [consentimento, setConsentimento] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    unidadeNome?: string;
    modalidadeNome?: string;
    prioridade?: { valor: string; rotulo: string; badge: string };
  } | null>(null);

  const webhookUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim();

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const nomeTrim = nome.trim();
    const emailTrim = email.trim();
    const whatsDigits = normalizeWhatsapp(whatsapp);

    if (nomeTrim.length < 2) nextErrors.nome = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim)) nextErrors.email = 'Informe um e-mail válido.';
    if (whatsDigits.length < 10 || whatsDigits.length > 11 || /^(\d)\1+$/.test(whatsDigits)) {
      nextErrors.whatsapp = 'Informe um WhatsApp válido com DDD.';
    }
    if (!unit) nextErrors.unidade = 'Selecione uma unidade.';
    if (!modalidade) nextErrors.modalidade = 'Selecione uma modalidade.';
    if (!prazo || !(prazo in CLASSIFICACAO_MAP)) nextErrors.prazo = 'Informe quando pretende começar.';
    if (!consentimento) nextErrors.consentimento = 'É necessário autorizar o contato para continuar.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setStatus(null);

    if (!validate()) {
      setStatus({
        type: 'error',
        title: 'Revise os campos destacados',
        message: 'Preencha corretamente todas as informações obrigatórias para continuar.',
      });
      return;
    }

    if (!webhookUrl) {
      setStatus({
        type: 'warning',
        title: 'Integração não configurada',
        message: 'Configure VITE_N8N_WEBHOOK_URL nas Environment Variables da Vercel.',
      });
      return;
    }

    const classificacaoInfo = CLASSIFICACAO_MAP[prazo as keyof typeof CLASSIFICACAO_MAP];

    const payload = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: normalizeWhatsapp(whatsapp),
      unidade: unit,
      modalidade,
      prazo,
      classificacao: classificacaoInfo.valor,
      data_solicitacao: new Date().toISOString(),
      consentimento: true,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setStatus({
          type: 'warning',
          title: 'Solicitação já registrada',
          message: data.message || 'Já existe uma solicitação ativa registrada para este número de WhatsApp.',
        });
        return;
      }

      if (!response.ok) {
        setStatus({
          type: 'error',
          title: 'Não foi possível concluir o envio',
          message: data.message || 'Ocorreu um erro ao processar sua solicitação. Seus dados foram mantidos.',
        });
        return;
      }

      setStatus({
        type: 'success',
        title: 'Solicitação recebida!',
        message:
          'Obrigado por escolher a Rede Ritmo! Seus dados foram encaminhados para nossa equipe. Em breve, entraremos em contato para dar continuidade ao atendimento.',
        unidadeNome: UNIDADE_LABELS[unit] || unit,
        modalidadeNome: MODALIDADE_LABELS[modalidade] || modalidade,
        prioridade: classificacaoInfo,
      });

      setNome('');
      setEmail('');
      setWhatsapp('');
      onUnitChange('');
      setModalidade('');
      setPrazo('');
      setConsentimento(false);
    } catch {
      setStatus({
        type: 'error',
        title: 'Falha de conexão com a integração',
        message: 'Não foi possível conectar ao servidor da recepção. Verifique se o workflow do n8n está publicado.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-[#191817] px-4 py-3 text-sm text-[#FFF6EF] placeholder:text-[#FFF6EF]/40 focus:border-[#FF6B2C] focus:outline-none transition-colors';
  const labelClass = 'block text-sm font-semibold text-[#FFF6EF] mb-1.5';
  const errorClass = 'mt-1 block text-xs text-red-400';

  return (
    <div className="rounded-2xl border border-white/15 bg-[#22201E] p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#FFF6EF]">Solicite sua aula grátis</h3>
        <p className="mt-1 text-sm text-[#FFF6EF]/70">Leva apenas alguns minutos.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="nome" className={labelClass}>Nome completo</label>
          <input
            id="nome"
            type="text"
            maxLength={100}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setErrors((prev) => ({ ...prev, nome: '' }));
            }}
            placeholder="Digite seu nome completo"
            className={inputClass}
            required
          />
          {errors.nome && <span className={errorClass} role="alert">{errors.nome}</span>}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="seuemail@exemplo.com"
            className={inputClass}
            required
          />
          {errors.email && <span className={errorClass} role="alert">{errors.email}</span>}
        </div>

        <div>
          <label htmlFor="whatsapp" className={labelClass}>WhatsApp com DDD</label>
          <input
            id="whatsapp"
            type="tel"
            maxLength={15}
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(formatWhatsapp(e.target.value));
              setErrors((prev) => ({ ...prev, whatsapp: '' }));
            }}
            placeholder="(48) 99999-9999"
            className={inputClass}
            required
          />
          {errors.whatsapp && <span className={errorClass} role="alert">{errors.whatsapp}</span>}
        </div>

        <div>
          <label htmlFor="unidade" className={labelClass}>Escolha sua unidade</label>
          <select
            id="unidade"
            value={unit}
            onChange={(e) => {
              onUnitChange(e.target.value);
              setErrors((prev) => ({ ...prev, unidade: '' }));
            }}
            className={inputClass}
            required
          >
            <option value="">Selecione uma unidade</option>
            <option value="centro">Centro</option>
            <option value="estreito">Estreito</option>
            <option value="sao-jose">São José</option>
          </select>
          {errors.unidade && <span className={errorClass} role="alert">{errors.unidade}</span>}
        </div>

        <div>
          <label htmlFor="modalidade" className={labelClass}>Qual modalidade deseja experimentar?</label>
          <select
            id="modalidade"
            value={modalidade}
            onChange={(e) => {
              setModalidade(e.target.value);
              setErrors((prev) => ({ ...prev, modalidade: '' }));
            }}
            className={inputClass}
            required
          >
            <option value="">Selecione uma modalidade</option>
            <option value="musculacao">Musculação</option>
            <option value="funcional">Funcional</option>
            <option value="pilates">Pilates</option>
            <option value="danca">Dança</option>
          </select>
          {errors.modalidade && <span className={errorClass} role="alert">{errors.modalidade}</span>}
        </div>

        <div>
          <label htmlFor="prazo" className={labelClass}>Quando pretende começar?</label>
          <select
            id="prazo"
            value={prazo}
            onChange={(e) => {
              setPrazo(e.target.value);
              setErrors((prev) => ({ ...prev, prazo: '' }));
            }}
            className={inputClass}
            required
          >
            <option value="">Selecione uma opção</option>
            <option value="esta-semana">Quero começar nesta semana</option>
            <option value="este-mes">Quero começar neste mês</option>
            <option value="pesquisando">Ainda estou pesquisando</option>
          </select>
          {errors.prazo && <span className={errorClass} role="alert">{errors.prazo}</span>}
        </div>

        <div className="pt-1">
          <label htmlFor="consentimento" className="flex items-start gap-3 text-xs text-[#FFF6EF]/80 cursor-pointer">
            <input
              id="consentimento"
              type="checkbox"
              checked={consentimento}
              onChange={(e) => {
                setConsentimento(e.target.checked);
                setErrors((prev) => ({ ...prev, consentimento: '' }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF6B2C]"
              required
            />
            <span>
              Autorizo a Rede Ritmo a utilizar meus dados para entrar em contato sobre minha solicitação de aula experimental.
            </span>
          </label>
          {errors.consentimento && <span className={errorClass} role="alert">{errors.consentimento}</span>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#FF6B2C] py-6 text-base font-semibold text-[#191817] hover:bg-[#e55a1f] transition-colors"
        >
          {isSubmitting ? 'Enviando solicitação...' : 'Solicitar aula experimental grátis'}
        </Button>

        {status && (
          <div
            aria-live="polite"
            className={`mt-4 rounded-lg border p-4 text-sm ${
              status.type === 'success'
                ? 'border-emerald-400/60 bg-emerald-500/10 text-[#FFF6EF]'
                : status.type === 'warning'
                ? 'border-amber-400/60 bg-amber-500/10 text-[#FFF6EF]'
                : 'border-red-400/60 bg-red-500/10 text-[#FFF6EF]'
            }`}
          >
            <strong className="block text-base font-bold mb-1">{status.title}</strong>
            <p className="text-[#FFF6EF]/85">{status.message}</p>
            {status.type === 'success' && (
              <div className="mt-3 space-y-1 text-xs text-[#FFF6EF]/80">
                <p><strong>Unidade escolhida:</strong> {status.unidadeNome}</p>
                <p><strong>Modalidade escolhida:</strong> {status.modalidadeNome}</p>
                <p><strong>Status:</strong> Recebimento confirmado pela recepção</p>
                {status.prioridade && (
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${status.prioridade.badge}`}>
                    Prioridade {status.prioridade.rotulo}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
