import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriaService, ProdutoService } from '../../core/api.services';
import { Categoria } from '../../core/models';
import { UNIDADES, mensagemErro } from '../../core/util';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>{{ editando() ? 'Editar produto' : 'Novo produto' }}</h1>
          <p>A mesma tela serve para editar: o título vira “Editar produto” e os campos vêm preenchidos.</p></div>
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

      <form class="card" style="max-width:820px" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
        <div class="campo"><label for="p-nome">Nome do produto</label>
          <input id="p-nome" type="text" formControlName="nome" maxlength="120" [attr.aria-invalid]="inv('nome')" />
          @if (inv('nome')) { <span class="erro-campo">Informe o nome do produto.</span> }</div>

        <div class="linha">
          <div class="campo"><label for="p-cat">Categoria</label>
            <select id="p-cat" formControlName="categoriaId" [attr.aria-invalid]="inv('categoriaId')">
              <option [ngValue]="null">Selecione</option>
              @for (c of categoriasAtivas(); track c.id) { <option [ngValue]="c.id">{{ c.nome }}</option> }
            </select>
            @if (inv('categoriaId')) { <span class="erro-campo">Selecione a categoria.</span> }
            <button type="button" class="btn link" style="align-self:flex-start" (click)="novaCategoria.set(!novaCategoria())">+ Nova categoria</button></div>
          <div class="campo"><label for="p-un">Unidade de medida</label>
            <select id="p-un" formControlName="unidadeMedida" [attr.aria-invalid]="inv('unidadeMedida')">
              <option value="">Selecione</option>
              @for (u of unidades; track u) { <option [value]="u">{{ u }}</option> }
            </select>
            @if (inv('unidadeMedida')) { <span class="erro-campo">Selecione a unidade.</span> }</div>
          <div class="campo"><label for="p-min">Quantidade mínima</label>
            <input id="p-min" type="number" step="any" min="0" formControlName="estoqueMinimo" placeholder="0" [attr.aria-invalid]="inv('estoqueMinimo')" />
            @if (inv('estoqueMinimo')) { <span class="erro-campo">Use zero ou mais.</span> }</div>
        </div>

        @if (novaCategoria()) {
          <div class="linha" style="margin-bottom:1rem">
            <div class="campo" style="margin:0"><label for="p-nova">Nome da nova categoria</label>
              <input id="p-nova" type="text" [formControl]="nomeCategoria" maxlength="80" /></div>
            <div class="campo" style="margin:0;flex:0 0 auto"><button type="button" class="btn" (click)="criarCategoria()">Criar categoria</button></div>
          </div>
        }

        <div class="campo" style="max-width:260px"><label for="p-custo">Custo de referência</label>
          <input id="p-custo" type="number" step="0.01" min="0" formControlName="custoReferencia" placeholder="R$ 0,00" [attr.aria-invalid]="inv('custoReferencia')" />
          @if (inv('custoReferencia')) { <span class="erro-campo">Informe um valor igual ou maior que zero.</span> }</div>

        @if (!editando()) { <p class="ajuda">O estoque começa em zero. Registre uma entrada (compra ou movimentação) para incluir quantidade.</p> }

        <div class="rodape-form">
          <a routerLink="/produtos" class="btn">Cancelar</a>
          <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Salvando…' : 'Salvar produto' }}</button>
        </div>
      </form>
    </div>
  `,
})
export class ProdutoFormComponent implements OnInit {
  /** Vem da rota /produtos/:id/editar (withComponentInputBinding). */
  id = input<string>();
  editando = computed(() => !!this.id());

  private api = inject(ProdutoService);
  private categoriasApi = inject(CategoriaService);
  private router = inject(Router);

  unidades = UNIDADES;
  categorias = signal<Categoria[]>([]);
  categoriasAtivas = computed(() => this.categorias().filter(c => c.ativo));
  novaCategoria = signal(false);
  nomeCategoria = new FormControl('', { nonNullable: true });
  erro = signal('');
  salvando = signal(false);
  private tentou = false;

  form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    categoriaId: [null as number | null, Validators.required],
    unidadeMedida: ['', Validators.required],
    estoqueMinimo: [null as number | null, [Validators.required, Validators.min(0)]],
    custoReferencia: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.categoriasApi.listar().subscribe({ next: c => this.categorias.set(c), error: e => this.erro.set(mensagemErro(e)) });
    const id = this.id();
    if (id) {
      this.api.buscar(+id).subscribe({
        next: p => this.form.patchValue({
          nome: p.nome, categoriaId: p.categoria.id, unidadeMedida: p.unidadeMedida,
          estoqueMinimo: p.estoqueMinimo, custoReferencia: p.custoReferencia,
        }),
        error: e => this.erro.set(mensagemErro(e)),
      });
    }
  }

  inv(c: 'nome' | 'categoriaId' | 'unidadeMedida' | 'estoqueMinimo' | 'custoReferencia') { const x = this.form.controls[c]; return x.invalid && (x.touched || this.tentou); }

  criarCategoria() {
    const nome = this.nomeCategoria.value.trim();
    if (!nome) return;
    this.categoriasApi.criar(nome).subscribe({
      next: c => {
        this.categorias.update(l => [...l, c]);
        this.form.controls.categoriaId.setValue(c.id);
        this.nomeCategoria.reset(); this.novaCategoria.set(false);
      },
      error: e => this.erro.set(mensagemErro(e)),
    });
  }

  salvar() {
    this.tentou = true; this.erro.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const corpo = {
      nome: v.nome.trim(), unidadeMedida: v.unidadeMedida,
      estoqueMinimo: v.estoqueMinimo!, custoReferencia: v.custoReferencia!,
      categoria: { id: v.categoriaId! },
    };
    this.salvando.set(true);
    const id = this.id();
    (id ? this.api.atualizar(+id, corpo) : this.api.criar(corpo)).subscribe({
      next: () => this.router.navigate(['/produtos']),
      error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); },
    });
  }
}
