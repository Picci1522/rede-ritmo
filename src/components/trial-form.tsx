import { useRef, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowUpRight, CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deadlines, formatWhatsapp, modalities, trialSchema, units } from '@/lib/trial-request';
import { submitTrialRequest } from '@/lib/trial-request.functions';

type Props = { unit: string; onUnitChange: (value: string) => void };
export function TrialForm({ unit, onUnitChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  type Result = { status: 'success'; unidade: string; modalidade: string } | { status: 'duplicate' | 'error' | 'pending'; message: string };
  const [result, setResult] = useState<Result | null>(null);
  const submit = useServerFn(submitTrialRequest);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const parsed = trialSchema.safeParse({ ...values, consentimento: values['consentimento'] === 'on' });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach(issue => { const key = String(issue.path[0]); if (!next[key]) next[key] = issue.message; });
      setErrors(next); setResult(null);
      const firstField = form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`);
      firstField?.focus(); return;
    }
    setErrors({}); sending.current = true; setBusy(true); setResult(null);
    try { setResult(await submit({ data: parsed.data })); }
    catch { setResult({ status: 'error', message: 'Não foi possível enviar sua solicitação. Seus dados foram mantidos. Tente novamente.' }); }
    finally { sending.current = false; setBusy(false); }
  }
  const error = (name: string) => errors[name] ? <p className="field-error" id={`${name}-error`}>{errors[name]}</p> : null;
  const invalid = (name: string) => ({ 'aria-invalid': Boolean(errors[name]), ...(errors[name] ? { 'aria-describedby': `${name}-error` } : {}) });
  return <div className="form-card">
    {result?.status === 'success' ? <div className="success-state" role="status">
      <CheckCircle2 aria-hidden="true" /><h3>Solicitação recebida!</h3>
      <p>Obrigado por escolher a Rede Ritmo! Seus dados foram encaminhados para nossa equipe. Em breve, entraremos em contato para dar continuidade ao atendimento.</p>
      <div className="success-details">Unidade {units.find(u => u.value === result.unidade)?.label} · {modalities.find(m => m.value === result.modalidade)?.label}</div>
      <p>Recebimento confirmado. A solicitação não garante vaga ou horário.</p>
    </div> : <>
      <h3>Solicite sua aula grátis</h3><p>Leva apenas alguns minutos.</p>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0">
          <div className="form-fields">
            <div className="field"><label htmlFor="nome">Nome completo <span className="text-primary">*</span></label><input id="nome" name="nome" placeholder="Como podemos chamar você?" autoComplete="name" required maxLength={100} {...invalid('nome')} />{error('nome')}</div>
            <div className="form-row">
              <div className="field"><label htmlFor="email">E-mail <span className="text-primary">*</span></label><input id="email" name="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" required maxLength={255} {...invalid('email')} />{error('email')}</div>
              <div className="field"><label htmlFor="whatsapp">WhatsApp com DDD <span className="text-primary">*</span></label><input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" placeholder="(48) 99999-9999" autoComplete="tel-national" required maxLength={20} onChange={e => { e.currentTarget.value = formatWhatsapp(e.currentTarget.value); }} {...invalid('whatsapp')} />{error('whatsapp')}</div>
            </div>
            <div className="field"><label htmlFor="unidade">Escolha sua unidade <span className="text-primary">*</span></label><select id="unidade" name="unidade" required value={unit} onChange={e => onUnitChange(e.target.value)} {...invalid('unidade')}><option value="">Selecione uma unidade</option>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select>{error('unidade')}</div>
            <div className="field"><label htmlFor="modalidade">Qual modalidade deseja experimentar? <span className="text-primary">*</span></label><select id="modalidade" name="modalidade" required defaultValue="" {...invalid('modalidade')}><option value="">Selecione uma modalidade</option>{modalities.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>{error('modalidade')}</div>
            <div className="field"><label htmlFor="prazo">Quando pretende começar? <span className="text-primary">*</span></label><select id="prazo" name="prazo" required defaultValue="" {...invalid('prazo')}><option value="">Selecione uma opção</option>{deadlines.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>{error('prazo')}</div>
            <div><label className="consent-label" htmlFor="consentimento"><input id="consentimento" name="consentimento" type="checkbox" required {...invalid('consentimento')} /><span>Autorizo a Rede Ritmo a utilizar meus dados para entrar em contato sobre minha solicitação de aula experimental.</span></label>{error('consentimento')}</div>
          </div>
          <Button className="campaign-button form-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" />Enviando solicitação…</> : <>Solicitar aula experimental grátis<ArrowUpRight /></>}</Button>
          <div className="form-disclaimer"><LockKeyhole aria-hidden="true" />Seus dados são tratados com cuidado.</div>
        </fieldset>
        <div aria-live="polite" aria-atomic="true">{result && <p className={`form-status ${result.status === 'pending' ? 'pending' : 'error'}`} role={result.status === 'pending' ? 'status' : 'alert'}>{result.message}</p>}</div>
      </form>
    </>}
  </div>;
}
