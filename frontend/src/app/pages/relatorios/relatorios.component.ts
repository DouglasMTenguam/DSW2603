import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EstoqueService, PainelService } from '../../core/api.services';
import { Alerta, Movimento, PerdasRelatorio, ResumoRelatorio } from '../../core/models';
import { ROTULO_PERDA, ROTULO_TIPO, baixarCsv, hojeISO, inicioMesISO, mensagemErro, quantidadeComSinal } from '../../core/util';

interface Vm {
  resumo: ResumoRelatorio; reposicao: Alerta[]; perdas: PerdasRelatorio; movs: Movimento[];
}
type Linha = { nome: string; quantidade: number };

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Relatórios</h1><p>Consulte movimentações, compras, perdas e reposição por período.</p></div>
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

      <form class="card" [formGroup]="form" (ngSubmit)="gerar()">
        <div class="linha">
          <div class="campo"><label for="r-de">Período — de</label><input id="r-de" type="date" formControlName="inicio" [max]="form.controls.fim.value || hoje()" /></div>
          <div class="campo"><label for="r-ate">Período — até</label><input id="r-ate" type="date" formControlName="fim" [min]="form.controls.inicio.value" [max]="hoje()" /></div>
          <div class="campo"><button type="submit" class="btn primario" [disabled]="carregando()">{{ carregando() ? 'Gerando…' : 'Gerar relatório' }}</button></div>
          <div class="campo"><button type="button" class="btn" (click)="exportar()" [disabled]="!vm()">Exportar CSV</button></div>
        </div>
      </form>

      @if (vm(); as d) {
        <div class="grid k4" style="margin-bottom:1.25rem">
          <div class="card kpi"><div class="rotulo">Entradas no período</div><div class="valor">{{ d.resumo.entradas | number:'1.0-3' }} un.</div></div>
          <div class="card kpi"><div class="rotulo">Saídas no período</div><div class="valor">{{ d.resumo.saidas | number:'1.0-3' }} un.</div></div>
          <div class="card kpi"><div class="rotulo">Compras</div><div class="valor">{{ d.resumo.compras | currency:'BRL' }}</div></div>
          <div class="card kpi"><div class="rotulo">Perdas</div><div class="valor">{{ d.resumo.perdasQuantidade | number:'1.0-3' }} un.</div>
            <div class="ajuda">Custo estimado: {{ d.resumo.perdasCusto | currency:'BRL' }}</div></div>
        </div>

        <div class="grid c2" style="margin-bottom:1.25rem">
          <section class="card sem-pad" aria-labelledby="r-repo">
            <h2 id="r-repo">Produtos que mais precisam de reposição</h2>
            <div class="tabela-wrap">
              <table>
                <thead><tr><th>Produto</th><th class="num">Estoque</th><th class="num">Mínimo</th><th class="num">Falta</th></tr></thead>
                <tbody>
                  @for (a of d.reposicao; track a.id) {
                    <tr><td>{{ a.nome }}</td><td class="num">{{ a.estoqueAtual | number:'1.0-3' }}</td><td class="num">{{ a.estoqueMinimo | number:'1.0-3' }}</td><td class="num forte">{{ a.reposicaoSugerida | number:'1.0-3' }}</td></tr>
                  } @empty { <tr><td colspan="4" class="vazio">Nenhum produto abaixo do mínimo.</td></tr> }
                </tbody>
              </table>
            </div>
          </section>

          <div>
            <section class="card" aria-labelledby="r-tipo">
              <h2 id="r-tipo">Perdas por tipo</h2>
              @for (l of tipos(d.perdas); track l.nome) {
                <div class="barra-linha">
                  <div class="topo"><span>{{ rotuloPerda(l.nome) }}</span><strong>{{ l.quantidade | number:'1.0-3' }} un.</strong></div>
                  <div class="barra" [style.width.%]="pct(l, tipos(d.perdas))"></div>
                </div>
              } @empty { <p class="ajuda">Nenhuma perda no período.</p> }
            </section>
            <section class="card" aria-labelledby="r-prod">
              <h2 id="r-prod">Perdas por produto</h2>
              @for (l of produtos(d.perdas); track l.nome) {
                <div class="barra-linha">
                  <div class="topo"><span>{{ l.nome }}</span><strong>{{ l.quantidade | number:'1.0-3' }} un.</strong></div>
                  <div class="barra" [style.width.%]="pct(l, produtos(d.perdas))"></div>
                </div>
              } @empty { <p class="ajuda">Nenhuma perda no período.</p> }
            </section>
          </div>
        </div>

        <section class="card sem-pad" aria-labelledby="r-mov">
          <h2 id="r-mov">Movimentações do período</h2>
          <div class="tabela-wrap">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th class="num">Quantidade</th><th>Responsável</th></tr></thead>
              <tbody>
                @for (m of d.movs; track m.id) {
                  <tr>
                    <td>{{ m.dataHora | date:'dd/MM/yyyy' }}</td><td>{{ m.produto.nome }}</td>
                    <td><span class="selo" [class.ok]="m.tipo==='ENTRADA'" [class.erro]="m.tipo==='SAIDA' || m.tipo==='PERDA'">{{ rotuloTipo(m.tipo) }}</span></td>
                    <td class="num forte">{{ qtd(m) }}</td><td>{{ m.usuario.nome }}</td>
                  </tr>
                } @empty { <tr><td colspan="5" class="vazio">Nenhuma movimentação no período.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class RelatoriosComponent implements OnInit {
  private painel = inject(PainelService);
  private estoque = inject(EstoqueService);

  form = inject(FormBuilder).nonNullable.group({ inicio: [inicioMesISO()], fim: [hojeISO()] });
  vm = signal<Vm | null>(null);
  erro = signal('');
  carregando = signal(false);

  ngOnInit() { this.gerar(); }

  /** Limite do calendário: calculado na hora, para não "congelar" se a tela ficar aberta virando o dia. */
  hoje() { return hojeISO(); }

  rotuloPerda(t: string) { return ROTULO_PERDA[t] ?? t; }
  rotuloTipo(t: string) { return ROTULO_TIPO[t as keyof typeof ROTULO_TIPO] ?? t; }
  qtd(m: Movimento) { return quantidadeComSinal(m); }
  tipos(p: PerdasRelatorio): Linha[] { return this.linhas(p.porTipo); }
  produtos(p: PerdasRelatorio): Linha[] { return this.linhas(p.porProduto); }
  private linhas(o: Record<string, number>): Linha[] {
    return Object.entries(o).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
  }
  pct(l: Linha, todas: Linha[]) { return (l.quantidade / Math.max(1, ...todas.map(x => x.quantidade))) * 100; }

  gerar() {
    const { inicio, fim } = this.form.getRawValue();
    if ((inicio && inicio > this.hoje()) || (fim && fim > this.hoje())) { this.erro.set('As datas do relatório não podem ser maiores que hoje.'); return; }
    if (inicio && fim && inicio > fim) { this.erro.set('A data inicial não pode ser depois da data final.'); return; }
    this.erro.set(''); this.carregando.set(true);
    forkJoin({
      resumo: this.painel.relatorioResumo(inicio, fim),
      reposicao: this.painel.relatorioReposicao(),
      perdas: this.painel.relatorioPerdas(inicio, fim),
      movs: this.estoque.movimentos({ inicio, fim }),
    }).subscribe({
      next: v => { this.vm.set(v); this.carregando.set(false); },
      error: e => { this.erro.set(mensagemErro(e)); this.carregando.set(false); },
    });
  }

  exportar() {
    const d = this.vm(); if (!d) return;
    const f = this.form.getRawValue();
    baixarCsv(`movimentacoes_${f.inicio}_a_${f.fim}.csv`, [
      ['Data', 'Produto', 'Tipo', 'Quantidade', 'Responsável', 'Motivo'],
      ...d.movs.map(m => [m.dataHora.slice(0, 10).split('-').reverse().join('/'), m.produto.nome, ROTULO_TIPO[m.tipo], quantidadeComSinal(m), m.usuario.nome, m.motivo ?? '']),
    ]);
  }
}