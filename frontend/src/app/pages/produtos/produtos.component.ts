import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { CategoriaService, ProdutoService } from '../../core/api.services';
import { Categoria, Produto } from '../../core/models';
import { mensagemErro } from '../../core/util';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Produtos</h1><p>{{ auth.admin() ? 'Cadastre, edite e desative mercadorias.' : 'Consulte as mercadorias cadastradas.' }}</p></div>
        @if (auth.admin()) { <a routerLink="/produtos/novo" class="btn primario">Novo produto</a> }
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

      <div class="card">
        <div class="linha">
          <div class="campo" style="flex:2 1 240px"><label for="b-nome">Buscar</label>
            <input id="b-nome" type="text" [formControl]="busca" placeholder="Nome do produto" /></div>
          <div class="campo"><label for="b-cat">Categoria</label>
            <select id="b-cat" [formControl]="categoria">
              <option [ngValue]="null">Todas as categorias</option>
              @for (c of categorias(); track c.id) { <option [ngValue]="c.id">{{ c.nome }}</option> }
            </select></div>
        </div>
      </div>

      <div class="card sem-pad">
        <div class="tabela-wrap">
          <table>
            <caption class="sr-only">Lista de produtos</caption>
            <thead><tr>
              <th>Produto</th><th>Categoria</th><th>Unidade</th><th>Estoque atual</th><th>Mínimo</th><th>Custo</th><th>Status</th>
              @if (auth.admin()) { <th>Ações</th> }
            </tr></thead>
            <tbody>
              @for (p of filtrados(); track p.id) {
                <tr>
                  <td><strong>{{ p.nome }}</strong></td>
                  <td>{{ p.categoria.nome }}</td>
                  <td>{{ p.unidadeMedida }}</td>
                  <td>{{ p.estoqueAtual | number:'1.0-3' }}
                    @if (baixo(p)) { <span class="selo erro">Baixo</span> }</td>
                  <td>{{ p.estoqueMinimo | number:'1.0-3' }}</td>
                  <td>{{ p.custoReferencia | currency:'BRL' }}</td>
                  <td><span class="selo" [class.ok]="p.ativo">{{ p.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  @if (auth.admin()) {
                    <td><span class="acoes">
                      <a class="btn pequeno" [routerLink]="['/produtos', p.id, 'editar']" [attr.aria-label]="'Editar ' + p.nome">Editar</a>
                      <button type="button" class="btn pequeno" (click)="alternar(p)" [attr.aria-label]="(p.ativo ? 'Desativar ' : 'Ativar ') + p.nome">{{ p.ativo ? 'Desativar' : 'Ativar' }}</button>
                    </span></td>
                  }
                </tr>
              } @empty { <tr><td [attr.colspan]="auth.admin() ? 8 : 7" class="vazio">Nenhum produto encontrado.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ProdutosComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ProdutoService);
  private categoriasApi = inject(CategoriaService);

  lista = signal<Produto[]>([]);
  categorias = signal<Categoria[]>([]);
  erro = signal('');
  busca = new FormControl('', { nonNullable: true });
  categoria = new FormControl<number | null>(null);
  private termo = toSignal(this.busca.valueChanges, { initialValue: '' });
  private catId = toSignal(this.categoria.valueChanges, { initialValue: null as number | null });

  filtrados = computed(() => {
    const t = this.termo().trim().toLowerCase(), c = this.catId();
    return this.lista().filter(p => (!t || p.nome.toLowerCase().includes(t)) && (c === null || p.categoria.id === c));
  });

  ngOnInit() {
    this.api.listar().subscribe({ next: l => this.lista.set(l), error: e => this.erro.set(mensagemErro(e)) });
    this.categoriasApi.listar().subscribe({ next: c => this.categorias.set(c), error: () => {} });
  }

  /** Mesma regra do backend (RN09): produto ativo com estoque menor ou igual ao mínimo. */
  baixo(p: Produto) { return p.ativo && p.estoqueAtual <= p.estoqueMinimo; }

  alternar(p: Produto) {
    this.erro.set('');
    this.api.definirAtivo(p.id, !p.ativo).subscribe({
      next: novo => this.lista.update(l => l.map(x => (x.id === novo.id ? novo : x))),
      error: e => this.erro.set(mensagemErro(e)),
    });
  }
}
