import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { deadlines, modalities, units } from '@/lib/trial-request';
import { countBy, filterLeads, sortLeads, type LeadFilters, type LeadRow } from '@/lib/lead-stats';
import logo from '@/assets/logo-horizontal-transparente.png.asset.json';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({ meta: [
    { title: 'Painel da recepção | Rede Ritmo' },
    { name: 'description', content: 'Pedidos de aula experimental por prioridade, unidade e modalidade.' },
    { property: 'og:title', content: 'Painel da recepção | Rede Ritmo' },
    { property: 'og:description', content: 'Pedidos de aula experimental por prioridade, unidade e modalidade.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminPage,
});

const label = (list: readonly { value: string; label: string }[], v: string) => list.find(i => i.value === v)?.label ?? v;
const priorities = [{ value: 'quente', label: 'Quente' }, { value: 'morno', label: 'Morno' }, { value: 'frio', label: 'Frio' }] as const;

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState<LeadFilters>({ prioridade: '', unidade: '', modalidade: '', de: '', ate: '' });
  const q = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: u.user!.id, _role: 'admin' });
      if (!isAdmin) return { isAdmin: false, rows: [] as LeadRow[] };
      const { data, error } = await supabase.from('leads').select('id,nome,email,whatsapp,unidade,modalidade,prazo,prioridade,status,created_at').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return { isAdmin: true, rows: (data ?? []) as LeadRow[] };
    },
  });
  const rows = useMemo(() => sortLeads(filterLeads(q.data?.rows ?? [], f)), [q.data, f]);
  const byP = countBy(rows, 'prioridade'), byU = countBy(rows, 'unidade'), byM = countBy(rows, 'modalidade');
  async function signOut() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: '/auth', replace: true }); }
  const set = (k: keyof LeadFilters) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return <main className="admin-shell">
    <header className="border-b border-border"><div className="mx-auto max-w-7xl flex items-center justify-between p-4">
      <img src={logo.url} alt="Rede Ritmo" className="h-7" />
      <Button variant="outline" size="sm" onClick={signOut}><LogOut />Sair</Button>
    </div></header>
    <div className="mx-auto max-w-7xl p-4 grid gap-5">
      <h1 className="text-2xl font-semibold">Painel da recepção</h1>
      {q.isLoading && <p>Carregando pedidos…</p>}
      {q.isError && <p className="text-destructive" role="alert">Não foi possível carregar os pedidos. Atualize a página.</p>}
      {q.data && !q.data.isAdmin && <div className="admin-card" role="alert">Sua conta ainda não tem permissão de administrador. Peça a liberação à coordenação.</div>}
      {q.data?.isAdmin && <>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Total', rows.length], ['Quentes', byP['quente'] ?? 0], ['Mornos', byP['morno'] ?? 0], ['Frios', byP['frio'] ?? 0]].map(([t, n]) =>
            <div key={t} className="admin-card"><p className="text-sm text-muted-foreground">{t}</p><p className="text-3xl font-semibold">{n}</p></div>)}
        </section>
        <section className="grid md:grid-cols-2 gap-3">
          <div className="admin-card"><h2 className="font-semibold mb-2">Por unidade</h2>{units.map(u => <p key={u.value} className="text-sm flex justify-between"><span>{u.label}</span><b>{byU[u.value] ?? 0}</b></p>)}</div>
          <div className="admin-card"><h2 className="font-semibold mb-2">Por modalidade</h2>{modalities.map(m => <p key={m.value} className="text-sm flex justify-between"><span>{m.label}</span><b>{byM[m.value] ?? 0}</b></p>)}</div>
        </section>
        <section className="admin-card flex flex-wrap gap-3 items-end" aria-label="Filtros">
          <label className="text-xs grid gap-1">Prioridade<select className="admin-input" value={f.prioridade} onChange={set('prioridade')}><option value="">Todas</option>{priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
          <label className="text-xs grid gap-1">Unidade<select className="admin-input" value={f.unidade} onChange={set('unidade')}><option value="">Todas</option>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>
          <label className="text-xs grid gap-1">Modalidade<select className="admin-input" value={f.modalidade} onChange={set('modalidade')}><option value="">Todas</option>{modalities.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
          <label className="text-xs grid gap-1">De<input type="date" className="admin-input" value={f.de} onChange={set('de')} /></label>
          <label className="text-xs grid gap-1">Até<input type="date" className="admin-input" value={f.ate} onChange={set('ate')} /></label>
          <Button variant="ghost" size="sm" onClick={() => setF({ prioridade: '', unidade: '', modalidade: '', de: '', ate: '' })}>Limpar</Button>
        </section>
        <section className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground">{['Prioridade', 'Nome', 'Contato', 'Unidade', 'Modalidade', 'Prazo', 'Data', 'Status'].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>}
              {rows.map(r => <tr key={r.id} className="border-t border-border align-top">
                <td className="py-2 pr-3"><span className={`priority-badge priority-${r.prioridade}`}>{r.prioridade.toUpperCase()}</span></td>
                <td className="py-2 pr-3">{r.nome}</td>
                <td className="py-2 pr-3"><a className="text-primary" href={`mailto:${r.email}`}>{r.email}</a><br /><a className="text-primary" href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer">+{r.whatsapp}</a></td>
                <td className="py-2 pr-3">{label(units, r.unidade)}</td>
                <td className="py-2 pr-3">{label(modalities, r.modalidade)}</td>
                <td className="py-2 pr-3">{label(deadlines, r.prazo)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                <td className="py-2 pr-3">{r.status}</td>
              </tr>)}
            </tbody>
          </table>
        </section>
      </>}
    </div>
  </main>;
}
