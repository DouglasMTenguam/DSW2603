import { HttpErrorResponse } from '@angular/common/http';
import { Movimento, TipoMovimento } from './models';

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hojeISO = () => toISO(new Date());
export const inicioMesISO = () => { const d = new Date(); d.setDate(1); return toISO(d); };

export const UNIDADES = ['kg', 'unidade', 'maço', 'caixa'];
export const ROTULO_TIPO: Record<TipoMovimento, string> = {
  ENTRADA: 'Entrada', SAIDA: 'Saída', PERDA: 'Perda', AJUSTE: 'Ajuste',
};
export const ROTULO_PERDA: Record<string, string> = {
  ESTRAGADO: 'Estragado', DANIFICADO: 'Danificado', DESCARTADO: 'Descartado', OUTROS: 'Outros',
};

/** O backend guarda o tipo da perda no começo do motivo ("ESTRAGADO: caiu no chão"). */
export function tipoDaPerda(motivo: string | null): string {
  const p = motivo?.includes(':') ? motivo.slice(0, motivo.indexOf(':')).trim().toUpperCase() : '';
  return ['ESTRAGADO', 'DANIFICADO', 'DESCARTADO'].includes(p) ? p : 'OUTROS';
}

/** Ajuste não tem sinal no banco: o sentido fica no motivo ("Aumento: …" / "Redução: …"). */
export function sinalDoMovimento(m: Movimento): 1 | -1 {
  if (m.tipo === 'ENTRADA') return 1;
  if (m.tipo === 'AJUSTE') return m.motivo?.startsWith('Redução') ? -1 : 1;
  return -1;
}
export function quantidadeComSinal(m: Movimento): string {
  const n = Math.abs(m.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  return (sinalDoMovimento(m) > 0 ? '+' : '−') + n;
}

/** Spring devolve { message } (spring.web.error.include-message=always). */
export function mensagemErro(e: unknown, padrao = 'Não foi possível concluir a operação. Tente novamente.'): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Sem conexão com o servidor.';
    if (e.status === 403) return 'Você não tem permissão para esta ação.';
    const b = e.error;
    if (typeof b === 'string' && b) return b;
    return b?.message || padrao;
  }
  return padrao;
}

export function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + linhas.map(l => l.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
}
