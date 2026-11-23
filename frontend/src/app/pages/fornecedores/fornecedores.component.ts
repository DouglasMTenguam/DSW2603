import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { FornecedorService } from '../../core/api.services';
import { Fornecedor } from '../../core/models';
import { mensagemErro } from '../../core/util';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Fornecedores</h1><p>Mantenha os dados de quem fornece cada mercadoria.</p></div>
        @if (auth.admin()) { <button type="button" class="btn primario" (click)="novo()">Novo fornecedor</button> }
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }
      @if (sucesso()) { <div class="alerta sucesso" role="status">{{ sucesso() }}</div> }

      <div class="grid c2">
        <section class="card sem-pad" aria-labelledby="f-lista">
          <h2 id="f-lista">Lista de fornecedores</h2>
          <div class="tabela-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Contato</th><th>Telefone</th><th>Situação</th>@if (auth.admin()) { <th>Ações</th> }</tr></thead>
              <tbody>
                @for (f of lista(); track f.id) {
                  <tr>
                    <td><strong>{{ f.nome }}</strong></td><td>{{ f.contato }}</td><td>{{ f.telefone }}</td>
                    <td><span class="selo" [class.ok]="f.ativo">{{ f.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                    @if (auth.admin()) {
                      <td><span class="acoes">
                        <button type="button" class="btn pequeno" (click)="editar(f)" [attr.aria-label]="'Editar ' + f.nome">Editar</button>
                        <button type="button" class="btn pequeno" (click)="alternar(f)" [attr.aria-label]="(f.ativo ? 'Desativar ' : 'Ativar ') + f.nome">{{ f.ativo ? 'Desativar' : 'Ativar' }}</button>
                      </span></td>
                    }
                  </tr>
                } @empty { <tr><td [attr.colspan]="auth.admin() ? 5 : 4" class="vazio">Nenhum fornecedor cadastrado.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>

        @if (auth.admin()) {
          <form class="card" [formGroup]="form" (ngSubmit)="salvar()" novalidate aria-labelledby="f-form">
            <h2 id="f-form">{{ editandoId() ? 'Editar fornecedor' : 'Novo fornecedor' }}</h2>
            <div class="campo"><label for="f-nome">Nome</label>
              <input id="f-nome" type="text" formControlName="nome" maxlength="120" [attr.aria-invalid]="inv('nome')" />
              @if (inv('nome')) { <span class="erro-campo">Informe o nome.</span> }</div>
            <div class="campo"><label for="f-contato">Contato</label>
              <input id="f-contato" type="text" formControlName="contato" maxlength="100" placeholder="Pessoa responsável" [attr.aria-invalid]="inv('contato')" />
              @if (inv('contato')) { <span class="erro-campo">Informe a pessoa de contato.</span> }</div>
            <div class="campo"><label for="f-tel">Telefone</label>
              <input id="f-tel" type="text" formControlName="telefone" maxlength="20" placeholder="(00) 00000-0000" [attr.aria-invalid]="inv('telefone')" />
              @if (inv('telefone')) { <span class="erro-campo">Informe o telefone.</span> }</div>
            <div class="campo"><span class="rotulo-grupo" id="f-sit">Situação</span>
              <div class="opcoes" role="radiogroup" aria-labelledby="f-sit">
                <label class="opcao"><input type="radio" formControlName="ativo" [value]="true" /> Ativo</label>
                <label class="opcao"><input type="radio" formControlName="ativo" [value]="false" /> Inativo</label>
              </div></div>
            <div class="rodape-form">
              <button type="button" class="btn" (click)="novo()">Cancelar</button>
              <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Salvando…' : 'Salvar fornecedor' }}</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class FornecedoresComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(FornecedorService);

  lista = signal<Fornecedor[]>([]);
  editandoId = signal<number | null>(null);
  erro = signal(''); sucesso = signal('');
  salvando = signal(false);
  private tentou = false;

  form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    contato: ['', [Validators.required, Validators.pattern(/\S/)]],
    telefone: ['', [Validators.required, Validators.pattern(/\S/)]],
    ativo: [true],
  });

  ngOnInit() { this.carregar(); }
  carregar() { this.api.listar().subscribe({ next: l => this.lista.set(l), error: e => this.erro.set(mensagemErro(e)) }); }

  inv(c: 'nome' | 'contato' | 'telefone') { const x = this.form.controls[c]; return x.invalid && (x.touched || this.tentou); }

  novo() { this.editandoId.set(null); this.tentou = false; this.erro.set(''); this.form.reset({ nome: '', contato: '', telefone: '', ativo: true }); }
  editar(f: Fornecedor) {
    this.sucesso.set(''); this.erro.set(''); this.tentou = false;
    this.editandoId.set(f.id);
    this.form.reset({ nome: f.nome, contato: f.contato, telefone: f.telefone, ativo: f.ativo });
  }

  alternar(f: Fornecedor) {
    this.erro.set(''); this.sucesso.set('');
    this.api.definirAtivo(f.id, !f.ativo).subscribe({ next: () => this.carregar(), error: e => this.erro.set(mensagemErro(e)) });
  }

  salvar() {
    this.tentou = true; this.erro.set(''); this.sucesso.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const corpo = { nome: v.nome.trim(), contato: v.contato.trim(), telefone: v.telefone.trim(), ativo: v.ativo };
    const id = this.editandoId();
    this.salvando.set(true);
    (id ? this.api.atualizar(id, corpo) : this.api.criar(corpo)).subscribe({
      next: salvo => {
        // garante a situação escolhida mesmo que o backend ignore "ativo" no corpo
        const fim = () => { this.salvando.set(false); this.sucesso.set('Fornecedor salvo.'); this.novo(); this.carregar(); };
        if (salvo.ativo !== v.ativo) this.api.definirAtivo(salvo.id, v.ativo).subscribe({ next: fim, error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); } });
        else fim();
      },
      error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); },
    });
  }
}
