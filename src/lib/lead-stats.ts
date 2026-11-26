export type Priority = 'quente' | 'morno' | 'frio';
export type LeadRow = { id: string; nome: string; email: string; whatsapp: string; unidade: string; modalidade: string; prazo: string; prioridade: Priority; status: string; created_at: string };
export type LeadFilters = { prioridade: string; unidade: string; modalidade: string; de: string; ate: string };
const rank: Record<Priority, number> = { quente: 0, morno: 1, frio: 2 };
export function sortLeads(rows: LeadRow[]) {
  return [...rows].sort((a, b) => rank[a.prioridade] - rank[b.prioridade] || b.created_at.localeCompare(a.created_at));
}
export function filterLeads(rows: LeadRow[], f: LeadFilters) {
  return rows.filter(r => (!f.prioridade || r.prioridade === f.prioridade) && (!f.unidade || r.unidade === f.unidade) && (!f.modalidade || r.modalidade === f.modalidade)
    && (!f.de || r.created_at.slice(0, 10) >= f.de) && (!f.ate || r.created_at.slice(0, 10) <= f.ate));
}
export function countBy(rows: LeadRow[], key: 'prioridade' | 'unidade' | 'modalidade') {
  return rows.reduce<Record<string, number>>((acc, r) => { acc[r[key]] = (acc[r[key]] ?? 0) + 1; return acc; }, {});
}
