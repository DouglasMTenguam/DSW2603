import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EstoqueService, ProdutoService } from '../../core/api.services';
import { Produto, TipoPerda } from '../../core/models';
import { hojeISO, mensagemErro } from '../../core/util';

@Component({
  selector: 'app-perdas',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Registro de perdas</h1><p>Registre produtos estragados, danificados ou descartados.</p></div>
      </div>

      @if (sucesso()) { <div class="alerta sucesso" role="status">{{ sucesso() }}</div> }
      @if (erro()) { <div class="alerta erro" role="alert"><strong>Não foi possível registrar a perda.</strong> {{ erro() }}</div> }

      <div class="grid c2">
        <form class="card" [formGroup]="form" (ngSubmit)="registrar()" novalidate>
          <div class="campo"><label for="p-prod">Produto</label>
            <select id="p-prod" formControlName="idProduto" [attr.aria-invalid]="inv('idProduto')">
              <option [ngValue]="null">Selecione</option>
              @for (p of ativos(); track p.id) { <option [ngValue]="p.id">{{ p.nome }}</option> }
            </select>
            @if (inv('idProduto')) { <span class="erro-campo">Selecione o produto.</span> }</div>

          <div class="campo"><span class="rotulo-grupo" id="p-tipo-l">Tipo de perda</span>
            <div class="opcoes" role="radiogroup" aria-labelledby="p-tipo-l">
              <label class="opcao"><input type="radio" formControlName="tipoPerda" value="ESTRAGADO" /> Estragado</label>
              <label class="opcao"><input type="radio" formControlName="tipoPerda" value="DANIFICADO" /> Danificado</label>
              <label class="opcao"><input type="radio" formControlName="tipoPerda" value="DESCARTADO" /> Descartado</label>
            </div></div>

          <div class="linha">
            <div class="campo"><label for="p-qtd">Quantidade</label>
              <input id="p-qtd" type="number" step="any" min="0" formControlName="quantidade"
                     [attr.aria-invalid]="inv('quantidade') || excede()" aria-describedby="p-qtd-erro" />
              <span id="p-qtd-erro">
                @if (excede()) { <span class="erro-campo">Maior que o estoque disponível ({{ produto()?.estoqueAtual | number:'1.0-3' }}).</span> }
                @else if (inv('quantidade')) { <span class="erro-campo">A quantidade deve ser maior que zero.</span> }
              </span></div>
            <div class="campo"><label for="p-data">Data</label>
              <input id="p-data" type="date" [value]="hoje" disabled aria-describedby="p-data-aj" />
              <span id="p-data-aj" class="ajuda">A perda é registrada com a data de hoje.</span></div>
          </div>

          <div class="campo"><label for="p-motivo">Motivo</label>
            <textarea id="p-motivo" formControlName="motivo" placeholder="Descreva o que aconteceu" [attr.aria-invalid]="inv('motivo')"></textarea>
            @if (inv('motivo')) { <span class="erro-campo">Informe o motivo da perda.</span> }</div>

          <div class="rodape-form">
            <button type="button" class="btn" (click)="limpar()">Cancelar</button>
            <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Registrando…' : 'Registrar perda' }}</button>
          </div>
        </form>

        <section class="card" aria-labelledby="p-efeito">
          <h2 id="p-efeito">Efeito no estoque</h2>
          <div class="lista-linhas">
            <div><span>Estoque atual — {{ produto()?.nome ?? 'selecione um produto' }}</span><strong>{{ produto() ? (produto()!.estoqueAtual | number:'1.0-3') : '—' }}</strong></div>
            <div><span>Perda a registrar</span><strong style="color:var(--err-ink)">−{{ qtd() | number:'1.0-3' }}</strong></div>
            <div><span>Estoque após o registro</span>
              <strong style="font-size:1.3rem">
                @if (!produto()) { — } @else if (excede()) { {{ produto()!.estoqueAtual | number:'1.0-3' }} (sem alteração) }
                @else { {{ produto()!.estoqueAtual - qtd() | number:'1.0-3' }} }
              </strong></div>
          </div>
          <p class="ajuda" style="background:#eff1ef;padding:1rem;border-radius:8px;margin-top:1rem">
            Ao registrar, o estoque diminui pela quantidade informada e uma movimentação do tipo Perda é criada com o motivo e o responsável.<br /><br />
            A perda também entra nos indicadores de desperdício, agrupada por produto e por tipo.
          </p>
        </section>
      </div>
    </div>
  `,
})
export class PerdasComponent implements OnInit {
  private api = inject(EstoqueService);
  private produtosApi = inject(ProdutoService);
  private fb = inject(FormBuilder);

  hoje = hojeISO();
  produtos = signal<Produto[]>([]);
  ativos = computed(() => this.produtos().filter(p => p.ativo));
  erro = signal(''); sucesso = signal('');
  salvando = signal(false);
  private tentou = signal(false);

  form = this.fb.nonNullable.group({
    idProduto: [null as number | null, Validators.required],
    tipoPerda: ['ESTRAGADO' as TipoPerda],
    quantidade: [null as number | null, [Validators.required, Validators.min(0.001)]],
    motivo: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  produto = computed(() => this.produtos().find(p => p.id === this.valores().idProduto));
  qtd = computed(() => this.valores().quantidade ?? 0);
  excede = computed(() => !!this.produto() && this.qtd() > this.produto()!.estoqueAtual);

  ngOnInit() { this.carregarProdutos(); }
  private carregarProdutos() {
    this.produtosApi.listar().subscribe({ next: p => this.produtos.set(p), error: e => this.erro.set(mensagemErro(e)) });
  }

  inv(c: 'idProduto' | 'quantidade' | 'motivo') { const x = this.form.controls[c]; return x.invalid && (x.touched || this.tentou()); }

  limpar() {
    this.tentou.set(false); this.erro.set('');
    this.form.reset({ idProduto: null, tipoPerda: 'ESTRAGADO', quantidade: null, motivo: '' });
  }

  registrar() {
    this.tentou.set(true); this.erro.set(''); this.sucesso.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const p = this.produto()!, v = this.form.getRawValue();
    if (this.excede()) {
      this.erro.set(`A quantidade informada (${v.quantidade}) é maior que o estoque de ${p.nome} (${p.estoqueAtual}). O estoque não foi alterado.`);
      return;
    }
    this.salvando.set(true);
    this.api.registrarPerda({ idProduto: v.idProduto!, quantidade: v.quantidade!, tipoPerda: v.tipoPerda, motivo: v.motivo.trim() }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.sucesso.set(`Perda registrada: ${v.quantidade} de ${p.nome}.`);
        this.limpar(); this.carregarProdutos();
      },
      error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); },
    });
  }
}
