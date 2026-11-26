import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

interface TrialFormProps {
  unit: string;
  onUnitChange: (value: string) => void;
}

const CLASSIFICACAO_MAP = {
  'esta-semana': { valor: 'quente', rotulo: 'QUENTE' },
  'este-mes': { valor: 'morno', rotulo: 'MORNO' },
  pesquisando: { valor: 'frio', rotulo: 'FRIO' },
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
    prioridade?: { valor: string; rotulo: string };
  } | null>(null);

  const webhookUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim();

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const nomeTrim = nome.trim();
    const emailTrim = email.trim();
    const whatsDigits = normalizeWhatsapp(whatsapp);

    if (nomeTrim.length < 2) {
      nextErrors.nome = 'Informe seu nome completo.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim)) {
      nextErrors.email = 'Informe um e-mail válido.';
    }
    if (whatsDigits.length < 10 || whatsDigits.length > 11 || /^(\d)\1+$/.test(whatsDigits)) {
      nextErrors.whatsapp = 'Informe um WhatsApp válido com DDD.';
    }
    if (!unit) {
      nextErrors.unidade = 'Selecione uma unidade.';
    }
    if (!modalidade) {
      nextErrors.modalidade = 'Selecione uma modalidade.';
    }
    if (!prazo || !(prazo in CLASSIFICACAO_MAP)) {
      nextErrors.prazo = 'Informe quando pretende começar.';
    }
    if (!consentimento) {
      nextErrors.consentimento = 'É necessário autorizar o contato para continuar.';
    }

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
        message: 'Configure a variável VITE_N8N_WEBHOOK_URL no arquivo .env com a Production URL do seu n8n.',
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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setStatus({
          type: 'warning',
          title: 'Solicitação já registrada',
          message:
            data.message ||
            'Já existe uma solicitação ativa registrada para este número de WhatsApp.',
        });
        return;
      }

      if (!response.ok) {
        setStatus({
          type: 'error',
          title: 'Não foi possível concluir o envio',
          message:
            data.message ||
            'Ocorreu um erro ao processar sua solicitação. Seus dados foram mantidos; tente novamente.',
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
        message:
          'Não foi possível conectar ao servidor da recepção. Verifique se o workflow do n8n está publicado e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h3>Solicite sua aula grátis</h3>
        <p>Leva apenas alguns minutos.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="nome">Nome completo</label>
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
            required
          />
          {errors.nome && <span className="field-error" role="alert">{errors.nome}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="seuemail@exemplo.com"
            required
          />
          {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="whatsapp">WhatsApp com DDD</label>
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
            required
          />
          {errors.whatsapp && <span className="field-error" role="alert">{errors.whatsapp}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="unidade">Escolha sua unidade</label>
          <select
            id="unidade"
            value={unit}
            onChange={(e) => {
              onUnitChange(e.target.value);
              setErrors((prev) => ({ ...prev, unidade: '' }));
            }}
            required
          >
            <option value="">Selecione uma unidade</option>
            <option value="centro">Centro</option>
            <option value="estreito">Estreito</option>
            <option value="sao-jose">São José</option>
          </select>
          {errors.unidade && <span className="field-error" role="alert">{errors.unidade}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="modalidade">Qual modalidade deseja experimentar?</label>
          <select
            id="modalidade"
            value={modalidade}
            onChange={(e) => {
              setModalidade(e.target.value);
              setErrors((prev) => ({ ...prev, modalidade: '' }));
            }}
            required
          >
            <option value="">Selecione uma modalidade</option>
            <option value="musculacao">Musculação</option>
            <option value="funcional">Funcional</option>
            <option value="pilates">Pilates</option>
            <option value="danca">Dança</option>
          </select>
          {errors.modalidade && <span className="field-error" role="alert">{errors.modalidade}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="prazo">Quando pretende começar?</label>
          <select
            id="prazo"
            value={prazo}
            onChange={(e) => {
              setPrazo(e.target.value);
              setErrors((prev) => ({ ...prev, prazo: '' }));
            }}
            required
          >
            <option value="">Selecione uma opção</option>
            <option value="esta-semana">Quero começar nesta semana</option>
            <option value="este-mes">Quero começar neste mês</option>
            <option value="pesquisando">Ainda estou pesquisando</option>
          </select>
          {errors.prazo && <span className="field-error" role="alert">{errors.prazo}</span>}
        </div>

        <div className="field-group">
          <label className="checkbox-label" htmlFor="consentimento">
            <input
              id="consentimento"
              type="checkbox"
              checked={consentimento}
              onChange={(e) => {
                setConsentimento(e.target.checked);
                setErrors((prev) => ({ ...prev, consentimento: '' }));
              }}
              required
            />
            <span>
              Autorizo a Rede Ritmo a utilizar meus dados para entrar em contato sobre minha solicitação de aula experimental.
            </span>
          </label>
          {errors.consentimento && (
            <span className="field-error" role="alert">{errors.consentimento}</span>
          )}
        </div>

        <Button type="submit" className="campaign-button w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando solicitação...' : 'Solicitar aula experimental grátis'}
        </Button>

        {status && (
          <div className={`form-status is-${status.type}`} aria-live="polite">
            <strong className="status-title">{status.title}</strong>
            <p>{status.message}</p>
            {status.type === 'success' && (
              <>
                <ul className="status-summary">
                  <li><strong>Unidade escolhida:</strong> {status.unidadeNome}</li>
                  <li><strong>Modalidade escolhida:</strong> {status.modalidadeNome}</li>
                  <li><strong>Status:</strong> Recebimento confirmado pela recepção</li>
                </ul>
                {status.prioridade && (
                  <span className={`priority-badge priority-${status.prioridade.valor}`}>
                    Prioridade {status.prioridade.rotulo}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
