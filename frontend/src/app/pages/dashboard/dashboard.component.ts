import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { CompraService, EstoqueService, PainelService } from '../../core/api.services';
import { Alerta, Compra, ItemCompra, ResumoDashboard } from '../../core/models';
import { ROTULO_PERDA, hojeISO, inicioMesISO, mensagemErro, tipoDaPerda } from '../../core/util';

interface Semana { label: string; entradas: number; saidas: number; }
interface CompraRecente { compra: Compra; itens: number; }
interface Vm {
  resumo: ResumoDashboard; alertas: Alerta[]; semanas: Semana[];
  perdas: { tipo: string; quantidade: number }[]; recentes: CompraRecente[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Dashboard</h1><p>Visão geral do estoque, compras e perdas.</p></div>
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }
      @if (carregando()) { <p role="status">Carregando…</p> }

      @if (vm(); as d) {
        <div class="grid k4" style="margin-bottom:1.25rem">
          <div class="card kpi"><div class="rotulo">Valor em estoque</div><div class="valor">{{ d.resumo.valorEstoque | currency:'BRL' }}</div></div>
          <div class="card kpi"><div class="rotulo">Abaixo do mínimo</div><div class="valor">{{ d.resumo.produtosEstoqueBaixo }} {{ d.resumo.produtosEstoqueBaixo === 1 ? 'produto' : 'produtos' }}</div></div>
          <div class="card kpi"><div class="rotulo">Compras no mês</div><div class="valor">{{ d.resumo.comprasMes | currency:'BRL' }}</div></div>
          <div class="card kpi"><div class="rotulo">Perdas no mês</div><div class="valor">{{ d.resumo.perdasMesQuantidade | number:'1.0-3' }} un.</div></div>
        </div>

        <div class="grid c2" style="margin-bottom:1.25rem">
          <section class="card" aria-labelledby="t-semana">
            <h2 id="t-semana">Entradas e saídas por semana</h2>
            <div class="grafico" role="img" [attr.aria-label]="descricaoGrafico(d.semanas)">
              @for (s of d.semanas; track s.label) {
                <div class="grupo"><div class="pares">
                  <span class="col ent" [style.height.%]="pct(s.entradas, d.semanas)"></span>
                  <span class="col sai" [style.height.%]="pct(s.saidas, d.semanas)"></span>
                </div></div>
              }
            </div>
            <div class="eixo">@for (s of d.semanas; track s.label) { <span>{{ s.label }}</span> }</div>
            <div class="legenda"><span class="ent">■ Entradas</span><span class="sai">■ Saídas</span></div>
          </section>

          <section class="card" aria-labelledby="t-perdas">
            <h2 id="t-perdas">Perdas por tipo</h2>
            @for (p of d.perdas; track p.tipo) {
              <div class="barra-linha">
                <div class="topo"><span>{{ rotulo(p.tipo) }}</span><strong>{{ p.quantidade | number:'1.0-3' }} un.</strong></div>
                <div class="barra" [style.width.%]="pctPerda(p.quantidade, d.perdas)"></div>
              </div>
            } @empty { <p class="ajuda">Nenhuma perda registrada neste mês.</p> }
          </section>
        </div>

        <div class="grid c2" style="margin-bottom:1.25rem">
          <section class="card" aria-labelledby="t-alertas">
            <h2 id="t-alertas">Alertas de estoque baixo</h2>
            <div class="lista-linhas">
              @for (a of d.alertas; track a.id) {
                <div><span>{{ a.nome }} — {{ a.estoqueAtual | number:'1.0-3' }} {{ a.unidadeMedida }} (mín. {{ a.estoqueMinimo | number:'1.0-3' }})</span><span class="selo erro">Baixo</span></div>
              } @empty { <p class="ajuda">Nenhum produto abaixo do mínimo.</p> }
            </div>
          </section>
          <section class="card" aria-labelledby="t-repo">
            <h2 id="t-repo">Sugestões de reposição</h2>
            <div class="lista-linhas">
              @for (a of d.alertas; track a.id) {
                <div><span>{{ a.nome }}</span><strong>comprar {{ a.reposicaoSugerida | number:'1.0-3' }} {{ a.unidadeMedida }}</strong></div>
              } @empty { <p class="ajuda">Sem reposição necessária.</p> }
            </div>
          </section>
        </div>

        <section class="card sem-pad" aria-labelledby="t-compras">
          <h2 id="t-compras">Compras recentes</h2>
          <div class="tabela-wrap">
            <table>
              <thead><tr><th>Data</th><th>Fornecedor</th><th>Itens</th><th class="num">Total</th></tr></thead>
              <tbody>
                @for (r of d.recentes; track r.compra.id) {
                  <tr>
                    <td>{{ r.compra.dataCompra | date:'dd/MM/yyyy' }}</td>
                    <td>{{ r.compra.fornecedor.nome }}
                      @if (r.compra.status === 'PENDENTE') { <span class="selo">Pendente</span> }</td>
                    <td>{{ r.itens }}</td>
                    <td class="num">{{ r.compra.valorTotal | currency:'BRL' }}</td>
                  </tr>
                } @empty { <tr><td colspan="4" class="vazio">Nenhuma compra registrada.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private painel = inject(PainelService);
  private estoque = inject(EstoqueService);
  private compras = inject(CompraService);

  vm = signal<Vm | null>(null);
  erro = signal('');
  carregando = signal(true);

  ngOnInit() {
    forkJoin({
      resumo: this.painel.resumo(),
      alertas: this.painel.alertas(),
      movs: this.estoque.movimentos({ inicio: inicioMesISO(), fim: hojeISO() }),
      compras: this.compras.listar(),
    }).subscribe({
      next: ({ resumo, alertas, movs, compras }) => {
        // semanas do mês (Sem 1 = dias 1–7, Sem 2 = 8–14, …) até hoje
        const n = Math.ceil(new Date().getDate() / 7);
        const semanas: Semana[] = Array.from({ length: n }, (_, i) => ({ label: `Sem ${i + 1}`, entradas: 0, saidas: 0 }));
        const porTipo = new Map<string, number>();
        for (const m of movs) {
          const dia = parseInt(m.dataHora.slice(8, 10), 10);
          const s = semanas[Math.min(Math.ceil(dia / 7), n) - 1];
          if (m.tipo === 'ENTRADA') s.entradas += m.quantidade;
          if (m.tipo === 'SAIDA') s.saidas += m.quantidade;
          if (m.tipo === 'PERDA') {
            const t = tipoDaPerda(m.motivo);
            porTipo.set(t, (porTipo.get(t) ?? 0) + m.quantidade);
          }
        }
        const perdas = [...porTipo].map(([tipo, quantidade]) => ({ tipo, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
        const ultimas = compras.slice(0, 3);
        const itens$: Observable<ItemCompra[][]> = ultimas.length ? forkJoin(ultimas.map(c => this.compras.itens(c.id))) : of([]);
        itens$.subscribe({
          next: listas => {
            const recentes = ultimas.map((compra, i) => ({ compra, itens: listas[i]?.length ?? 0 }));
            this.vm.set({ resumo, alertas, semanas, perdas, recentes });
            this.carregando.set(false);
          },
          error: e => { this.erro.set(mensagemErro(e)); this.carregando.set(false); },
        });
      },
      error: e => { this.erro.set(mensagemErro(e)); this.carregando.set(false); },
    });
  }

  rotulo(t: string) { return ROTULO_PERDA[t] ?? t; }
  pct(v: number, s: Semana[]) { const max = Math.max(1, ...s.flatMap(x => [x.entradas, x.saidas])); return (v / max) * 100; }
  pctPerda(v: number, l: { quantidade: number }[]) { return (v / Math.max(1, ...l.map(x => x.quantidade))) * 100; }
  descricaoGrafico(s: Semana[]) {
    return 'Entradas e saídas por semana: ' + s.map(x => `${x.label}, ${x.entradas} entradas e ${x.saidas} saídas`).join('; ');
  }
}
