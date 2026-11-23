import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstoqueService, ProdutoService } from '../../core/api.services';
import { Movimento, Produto } from '../../core/models';
import { ROTULO_TIPO, hojeISO, inicioMesISO, mensagemErro, quantidadeComSinal, sinalDoMovimento } from '../../core/util';

const POR_PAGINA = 10;

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Estoque e movimentações</h1><p>Histórico de entradas, saídas e ajustes por produto.</p></div>
        <button type="button" class="btn primario" (click)="abrir()">+ Registrar movimentação</button>
      </div>

      @if (sucesso()) { <div class="alerta sucesso" role="status">{{ sucesso() }}</div> }
      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

      <form class="card filtros" [formGroup]="filtro" (ngSubmit)="filtrar()">
        <div class="linha">
          <div class="campo"><label for="f-de">Período — de</label><input id="f-de" type="date" formControlName="inicio" /></div>
          <div class="campo"><label for="f-ate">Período — até</label><input id="f-ate" type="date" formControlName="fim" /></div>
          <div class="campo"><label for="f-prod">Produto</label>
            <select id="f-prod" formControlName="produtoId">
              <option [ngValue]="null">Todos os produtos</option>
              @for (p of produtos(); track p.id) { <option [ngValue]="p.id">{{ p.nome }}</option> }
            </select></div>
          <div class="campo"><label for="f-tipo">Tipo de movimentação</label>
            <select id="f-tipo" formControlName="tipo">
              <option value="">Todos os tipos</option>
              @for (t of tipos; track t) { <option [value]="t">{{ rotulo(t) }}</option> }
            </select></div>
          <div class="campo acoes" style="flex:0 0 auto; flex-direction:row">
            <button type="submit" class="btn escuro">Filtrar</button>
            <button type="button" class="btn" (click)="limpar()">Limpar</button>
          </div>
        </div>
      </form>

      <div class="card sem-pad">
        <div class="tabela-wrap">
          <table>
            <caption class="sr-only">Movimentações de estoque</caption>
            <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th class="num">Quantidade</th><th>Responsável</th></tr></thead>
            <tbody>
              @for (m of pagina(); track m.id) {
                <tr>
                  <td>{{ m.dataHora | date:'dd/MM/yyyy' }}</td>
                  <td><strong>{{ m.produto.nome }}</strong></td>
                  <td><span class="selo" [class.ok]="m.tipo==='ENTRADA'" [class.erro]="m.tipo==='SAIDA' || m.tipo==='PERDA'">{{ rotulo(m.tipo) }}</span></td>
                  <td class="num forte">{{ qtd(m) }}</td>
                  <td>{{ m.usuario.nome }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="vazio">Nenhuma movimentação no período.</td></tr> }
            </tbody>
          </table>
        </div>
        <div class="tabela-rodape">
          <span role="status">{{ resumoPagina() }}</span>
          <span class="acoes">
            <button type="button" class="btn pequeno" (click)="pag.set(pag() - 1)" [disabled]="pag() === 0">Anterior</button>
            <button type="button" class="btn pequeno" (click)="pag.set(pag() + 1)" [disabled]="pag() >= totalPaginas() - 1">Próxima</button>
          </span>
        </div>
      </div>

      <dialog #dlg aria-labelledby="t-mov" (close)="aoFechar()">
        <h2 id="t-mov">Registrar movimentação</h2>
        @if (erroModal()) { <div class="alerta erro" role="alert">{{ erroModal() }}</div> }
        <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
          <div class="campo"><label for="m-prod">Produto</label>
            <select id="m-prod" formControlName="idProduto" [attr.aria-invalid]="inv('idProduto')">
              <option [ngValue]="null">Selecione</option>
              @for (p of ativos(); track p.id) { <option [ngValue]="p.id">{{ p.nome }} (estoque: {{ p.estoqueAtual }} {{ p.unidadeMedida }})</option> }
            </select>
            @if (inv('idProduto')) { <span class="erro-campo">Selecione o produto.</span> }</div>
          <div class="campo"><span class="rotulo-grupo" id="m-tipo-l">Tipo</span>
            <div class="opcoes" role="radiogroup" aria-labelledby="m-tipo-l">
              <label class="opcao"><input type="radio" formControlName="tipo" value="ENTRADA" /> Entrada</label>
              <label class="opcao"><input type="radio" formControlName="tipo" value="SAIDA" /> Saída</label>
              <label class="opcao"><input type="radio" formControlName="tipo" value="AJUSTE" /> Ajuste</label>
            </div></div>
          @if (form.controls.tipo.value === 'AJUSTE') {
            <div class="campo"><span class="rotulo-grupo" id="m-aj-l">O ajuste…</span>
              <div class="opcoes" role="radiogroup" aria-labelledby="m-aj-l">
                <label class="opcao"><input type="radio" formControlName="aumentar" [value]="true" /> Aumenta o estoque</label>
                <label class="opcao"><input type="radio" formControlName="aumentar" [value]="false" /> Reduz o estoque</label>
              </div></div>
          }
          <div class="campo"><label for="m-qtd">Quantidade</label>
            <input id="m-qtd" type="number" step="any" min="0" formControlName="quantidade" [attr.aria-invalid]="inv('quantidade')" />
            @if (inv('quantidade')) { <span class="erro-campo">A quantidade deve ser maior que zero.</span> }</div>
          <div class="campo"><label for="m-motivo">Motivo {{ form.controls.tipo.value === 'AJUSTE' ? '' : '(opcional)' }}</label>
            <textarea id="m-motivo" formControlName="motivo"></textarea></div>
          <div class="rodape-form">
            <button type="button" class="btn" (click)="dlg.close()">Cancelar</button>
            <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Salvando…' : 'Registrar' }}</button>
          </div>
        </form>
      </dialog>
    </div>
  `,
})
export class MovimentacoesComponent implements OnInit {
  private api = inject(EstoqueService);
  private produtosApi = inject(ProdutoService);
  private fb = inject(FormBuilder);
  @ViewChild('dlg') dlg!: ElementRef<HTMLDialogElement>;

  tipos = ['ENTRADA', 'SAIDA', 'PERDA', 'AJUSTE'] as const;
  produtos = signal<Produto[]>([]);
  ativos = computed(() => this.produtos().filter(p => p.ativo));
  lista = signal<Movimento[]>([]);
  pag = signal(0);
  erro = signal(''); sucesso = signal(''); erroModal = signal('');
  salvando = signal(false);
  private tentou = false;

  filtro = this.fb.group({
    inicio: [inicioMesISO()], fim: [hojeISO()],
    produtoId: [null as number | null], tipo: [''],
  });
  form = this.fb.nonNullable.group({
    idProduto: [null as number | null, Validators.required],
    tipo: ['ENTRADA' as 'ENTRADA' | 'SAIDA' | 'AJUSTE'],
    aumentar: [true],
    quantidade: [null as number | null, [Validators.required, Validators.min(0.001)]],
    motivo: [''],
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.lista().length / POR_PAGINA)));
  pagina = computed(() => this.lista().slice(this.pag() * POR_PAGINA, (this.pag() + 1) * POR_PAGINA));
  resumoPagina = computed(() => {
    const n = this.lista().length;
    if (!n) return 'Nenhuma movimentação no período';
    const ini = this.pag() * POR_PAGINA + 1, fim = Math.min(n, (this.pag() + 1) * POR_PAGINA);
    return `Exibindo ${ini}–${fim} de ${n} movimentações no período`;
  });

  ngOnInit() {
    this.produtosApi.listar().subscribe({ next: p => this.produtos.set(p), error: e => this.erro.set(mensagemErro(e)) });
    this.carregar();
  }

  rotulo(t: string) { return ROTULO_TIPO[t as keyof typeof ROTULO_TIPO] ?? t; }
  qtd(m: Movimento) { return quantidadeComSinal(m); }
  sinal(m: Movimento) { return sinalDoMovimento(m); }
  inv(c: 'idProduto' | 'quantidade') { const x = this.form.controls[c]; return x.invalid && (x.touched || this.tentou); }

  carregar() {
    const f = this.filtro.getRawValue();
    this.api.movimentos({ inicio: f.inicio || undefined, fim: f.fim || undefined, produtoId: f.produtoId, tipo: f.tipo || undefined })
      .subscribe({
        next: l => { this.lista.set(l); this.pag.set(0); this.erro.set(''); },
        error: e => this.erro.set(mensagemErro(e)),
      });
  }
  filtrar() { this.carregar(); }
  limpar() { this.filtro.reset({ inicio: inicioMesISO(), fim: hojeISO(), produtoId: null, tipo: '' }); this.carregar(); }

  abrir() { this.sucesso.set(''); this.erroModal.set(''); this.dlg.nativeElement.showModal(); }
  aoFechar() { this.tentou = false; this.form.reset({ idProduto: null, tipo: 'ENTRADA', aumentar: true, quantidade: null, motivo: '' }); }

  salvar() {
    this.tentou = true; this.erroModal.set('');
    const v = this.form.getRawValue();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (v.tipo === 'AJUSTE' && !v.motivo.trim()) { this.erroModal.set('Informe o motivo do ajuste.'); return; }
    this.salvando.set(true);
    this.api.registrarMovimento({
      idProduto: v.idProduto!, tipo: v.tipo, quantidade: v.quantidade!,
      motivo: v.motivo.trim() || undefined, aumentar: v.tipo === 'AJUSTE' ? v.aumentar : undefined,
    }).subscribe({
      next: () => {
        this.salvando.set(false); this.dlg.nativeElement.close();
        this.sucesso.set('Movimentação registrada. O estoque foi atualizado.');
        this.carregar();
        this.produtosApi.listar().subscribe(p => this.produtos.set(p));
      },
      error: e => { this.salvando.set(false); this.erroModal.set(mensagemErro(e)); },
    });
  }
}
