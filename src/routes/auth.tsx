import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-horizontal-transparente.png.asset.json';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Acesso da equipe | Rede Ritmo' },
    { name: 'description', content: 'Área restrita para a equipe da recepção Rede Ritmo.' },
    { property: 'og:title', content: 'Acesso da equipe | Rede Ritmo' },
    { property: 'og:description', content: 'Área restrita para a equipe da recepção Rede Ritmo.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim(); const password = String(f.get('password') ?? '');
    if (!email || password.length < 8) { setMsg({ ok: false, text: 'Informe e-mail e senha com ao menos 8 caracteres.' }); return; }
    setBusy(true); setMsg(null);
    if (mode === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) setMsg({ ok: false, text: 'E-mail ou senha incorretos, ou e-mail ainda não confirmado.' });
      else navigate({ to: '/admin' });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/admin' } });
      setBusy(false);
      setMsg(error ? { ok: false, text: 'Não foi possível criar a conta. Tente outro e-mail.' } : { ok: true, text: 'Conta criada. Confirme pelo link enviado ao seu e-mail. O acesso ao painel depende de liberação de administrador.' });
    }
  }
  return <main className="admin-shell flex items-center justify-center p-6">
    <div className="admin-card w-full max-w-sm">
      <Link to="/"><img src={logo.url} alt="Rede Ritmo" className="h-8 mb-6" /></Link>
      <h1 className="text-xl font-semibold mb-1">{mode === 'entrar' ? 'Entrar no painel' : 'Criar conta da equipe'}</h1>
      <p className="text-sm text-muted-foreground mb-5">Área restrita à recepção.</p>
      <form onSubmit={onSubmit} className="grid gap-3" noValidate>
        <label className="text-sm">E-mail<input name="email" type="email" autoComplete="email" className="admin-input w-full mt-1" /></label>
        <label className="text-sm">Senha<input name="password" type="password" autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} className="admin-input w-full mt-1" /></label>
        <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}{mode === 'entrar' ? 'Entrar' : 'Criar conta'}</Button>
      </form>
      {msg && <p role="status" className={`text-sm mt-3 ${msg.ok ? 'text-foreground' : 'text-destructive'}`}>{msg.text}</p>}
      <button type="button" className="text-sm text-primary mt-4 underline" onClick={() => { setMode(mode === 'entrar' ? 'criar' : 'entrar'); setMsg(null); }}>{mode === 'entrar' ? 'Criar conta da equipe' : 'Já tenho conta'}</button>
    </div>
  </main>;
}
