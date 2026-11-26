import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompraService, FornecedorService, ProdutoService } from '../../core/api.services';
import { Fornecedor, Produto } from '../../core/models';
import { hojeISO, mensagemErro } from '../../core/util';

type ItemGroup = FormGroup<{
  idProduto: FormControl<number | null>;
  quantidade: FormControl<number | null>;
  custoUnitario: FormControl<number | null>;
}>;

/** A data não pode ser maior que hoje (datas ISO 'yyyy-MM-dd' comparam certo como texto). */
function naoFutura(c: AbstractControl): ValidationErrors | null {
  return c.value && c.value > hojeISO() ? { futura: true } : null;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Compras e recebimento</h1><p>Registre a mercadoria recebida do fornecedor e atualize o estoque.</p></div>
      </div>

      @if (sucesso()) { <div class="alerta sucesso" role="status">{{ sucesso() }} <a routerLink="/estoque">Ver movimentações</a></div> }
      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

      <form [formGroup]="form" (ngSubmit)="confirmar()" novalidate>
        <div class="card">
          <div class="linha">
            <div class="campo"><label for="c-forn">Fornecedor</label>
              <select id="c-forn" formControlName="idFornecedor" [attr.aria-invalid]="inv('idFornecedor')">
                <option [ngValue]="null">Selecione o fornecedor</option>
                @for (f of fornecedores(); track f.id) { <option [ngValue]="f.id">{{ f.nome }}</option> }
              </select>
              @if (inv('idFornecedor')) { <span class="erro-campo">Selecione o fornecedor.</span> }</div>
            <div class="campo"><label for="c-data">Data do recebimento</label>
              <input id="c-data" type="date" formControlName="data" [max]="hoje()" [attr.aria-invalid]="inv('data')" />
              @if (inv('data')) {
                <span class="erro-campo">{{ form.controls.data.hasError('futura') ? 'A data não pode ser maior que hoje.' : 'Informe a data.' }}</span>
              }</div>
          </div>
        </div>

        <div class="card sem-pad">
          <h2>Produtos recebidos</h2>
          <div class="tabela-wrap">
            <table>
              <thead><tr><th>Produto</th><th>Quantidade</th><th>Custo unitário</th><th class="num">Subtotal</th><th><span class="sr-only">Remover</span></th></tr></thead>
              <tbody formArrayName="itens">
                @for (g of itens.controls; track g; let i = $index) {
                  <tr [formGroupName]="i">
                    <td><select formControlName="idProduto" [attr.aria-label]="'Produto da linha ' + (i + 1)" [attr.aria-invalid]="invItem(g, 'idProduto')">
                        <option [ngValue]="null">Selecione</option>
                        @for (p of ativos(); track p.id) { <option [ngValue]="p.id">{{ p.nome }}</option> }
                      </select></td>
                    <td><input type="number" step="any" min="0" formControlName="quantidade" [attr.aria-label]="'Quantidade da linha ' + (i + 1)" [attr.aria-invalid]="invItem(g, 'quantidade')" style="max-width:120px" /></td>
                    <td><input type="number" step="0.01" min="0" formControlName="custoUnitario" [attr.aria-label]="'Custo unitário da linha ' + (i + 1)" [attr.aria-invalid]="invItem(g, 'custoUnitario')" style="max-width:140px" /></td>
                    <td class="num forte">{{ subtotal(g) | currency:'BRL' }}</td>
                    <td><button type="button" class="btn pequeno" (click)="remover(i)" [disabled]="itens.length === 1" [attr.aria-label]="'Remover linha ' + (i + 1)">Remover</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="tabela-rodape">
            <button type="button" class="btn" (click)="adicionar()">+ Adicionar produto</button>
            <span>Total do recebimento <strong style="font-size:1.4rem;color:var(--ink)">{{ total() | currency:'BRL' }}</strong></span>
          </div>
        </div>
        @if (tentou() && itensInvalidos()) {
          <p class="erro-campo" role="alert">Preencha produto, quantidade e custo (maiores que zero) em todas as linhas.</p>
        }

        <div class="card">
          <h2>Ao confirmar o recebimento</h2>
          <p class="ajuda">O estoque de cada produto aumenta pela quantidade recebida e uma movimentação do tipo Entrada é registrada com data, produto, quantidade e responsável.</p>
          <div class="chips">
            @for (c of chips(); track $index) { <span class="selo ok">{{ c }}</span> }
          </div>
        </div>

        <div class="rodape-form">
          <button type="button" class="btn" (click)="cancelar()">Cancelar</button>
          <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Confirmando…' : 'Confirmar recebimento' }}</button>
        </div>
      </form>
    </div>
  `,
})
export class ComprasComponent implements OnInit {
  private api = inject(CompraService);
  private fornecedoresApi = inject(FornecedorService);
  private produtosApi = inject(ProdutoService);
  private fb = inject(FormBuilder);

  fornecedores = signal<Fornecedor[]>([]);
  produtos = signal<Produto[]>([]);
  ativos = computed(() => this.produtos().filter(p => p.ativo));
  erro = signal(''); sucesso = signal('');
  salvando = signal(false); tentou = signal(false);
  /** Se a compra foi criada mas o recebimento falhou, reaproveitamos o id (evita compra duplicada). */
  private pendenteId: number | null = null;
  private tick = signal(0);

  form = this.fb.group({
    idFornecedor: [null as number | null, Validators.required],
    data: [hojeISO(), [Validators.required, naoFutura]],
    itens: this.fb.array<ItemGroup>([]),
  });
  get itens() { return this.form.controls.itens as FormArray<ItemGroup>; }
  /** Limite do calendário: calculado na hora, para não "congelar" se a tela ficar aberta virando o dia. */
  hoje() { return hojeISO(); }

  constructor() { this.adicionar(); }

  ngOnInit() {
    this.fornecedoresApi.listar().subscribe({ next: l => this.fornecedores.set(l.filter(f => f.ativo)), error: e => this.erro.set(mensagemErro(e)) });
    this.produtosApi.listar().subscribe({ next: l => this.produtos.set(l), error: e => this.erro.set(mensagemErro(e)) });
    this.form.valueChanges.subscribe(() => this.tick.update(n => n + 1));
  }

  private novoItem(): ItemGroup {
    const g: ItemGroup = new FormGroup({
      idProduto: new FormControl<number | null>(null, Validators.required),
      quantidade: new FormControl<number | null>(null, [Validators.required, Validators.min(0.001)]),
      custoUnitario: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    });
    // sugere o custo de referência do produto escolhido
    g.controls.idProduto.valueChanges.subscribe(id => {
      const p = this.produtos().find(x => x.id === id);
      if (p && !g.controls.custoUnitario.value) g.controls.custoUnitario.setValue(p.custoReferencia);
    });
    return g;
  }
  adicionar() { this.itens.push(this.novoItem()); }
  remover(i: number) { if (this.itens.length > 1) this.itens.removeAt(i); }

  subtotal(g: ItemGroup) { return (g.controls.quantidade.value ?? 0) * (g.controls.custoUnitario.value ?? 0); }
  total() { this.tick(); return this.itens.controls.reduce((s, g) => s + this.subtotal(g), 0); }
  chips() {
    this.tick();
    return this.itens.controls
      .filter(g => g.controls.idProduto.value && (g.controls.quantidade.value ?? 0) > 0)
      .map(g => `${this.produtos().find(p => p.id === g.controls.idProduto.value)?.nome}: +${g.controls.quantidade.value}`);
  }
  inv(c: 'idFornecedor' | 'data') { const x = this.form.controls[c]; return x.invalid && (x.touched || this.tentou()); }
  invItem(g: ItemGroup, c: keyof ItemGroup['controls']) { const x = g.controls[c]; return x.invalid && (x.touched || this.tentou()); }
  itensInvalidos() { return this.itens.controls.some(g => g.invalid); }

  cancelar() { this.reiniciar(); this.erro.set(''); this.sucesso.set(''); }
  private reiniciar() {
    this.pendenteId = null; this.tentou.set(false);
    this.form.reset({ idFornecedor: null, data: hojeISO() });
    this.itens.clear(); this.adicionar();
  }

  confirmar() {
    this.tentou.set(true); this.erro.set(''); this.sucesso.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando.set(true);
    const v = this.form.getRawValue();

    const receber = (id: number) => this.api.receber(id).subscribe({
      next: () => {
        this.salvando.set(false);
        this.sucesso.set(`Recebimento confirmado: o estoque foi atualizado (total ${this.moeda(this.total())}).`);
        this.reiniciar();
        this.produtosApi.listar().subscribe(p => this.produtos.set(p));
      },
      error: e => {
        this.salvando.set(false); this.pendenteId = id;
        this.erro.set(`A compra #${id} foi registrada como pendente, mas o recebimento falhou: ${mensagemErro(e)} Clique em "Confirmar recebimento" para tentar de novo.`);
      },
    });

    if (this.pendenteId) { receber(this.pendenteId); return; }
    this.api.criar({
      dataCompra: v.data!, idFornecedor: v.idFornecedor!,
      itens: v.itens.map(i => ({ idProduto: i.idProduto!, quantidade: i.quantidade!, custoUnitario: i.custoUnitario! })),
    }).subscribe({
      next: c => receber(c.id),
      error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); },
    });
  }
  private moeda(n: number) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
}