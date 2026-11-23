import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/api.services';
import { Perfil, Usuario } from '../../core/models';
import { mensagemErro } from '../../core/util';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="pagina">
      <div class="pagina-head">
        <div><h1>Usuários <span class="selo">Acesso restrito ao administrador</span></h1>
          <p>Cadastre feirantes e administradores que podem entrar no sistema.</p></div>
        <button type="button" class="btn primario" (click)="novo()">Novo usuário</button>
      </div>

      @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }
      @if (sucesso()) { <div class="alerta sucesso" role="status">{{ sucesso() }}</div> }

      <div class="grid c2">
        <section class="card sem-pad" aria-labelledby="u-lista">
          <h2 id="u-lista">Lista de usuários</h2>
          <div class="tabela-wrap">
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead>
              <tbody>
                @for (u of lista(); track u.id) {
                  <tr>
                    <td><strong>{{ u.nome }}</strong></td><td>{{ u.email }}</td>
                    <td>{{ u.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Feirante / operador' }}</td>
                    <td><span class="selo" [class.ok]="u.ativo">{{ u.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                    <td><span class="acoes">
                      <button type="button" class="btn pequeno" (click)="editar(u)" [attr.aria-label]="'Editar ' + u.nome">Editar</button>
                      <button type="button" class="btn pequeno" (click)="alternar(u)" [attr.aria-label]="(u.ativo ? 'Desativar ' : 'Ativar ') + u.nome">{{ u.ativo ? 'Desativar' : 'Ativar' }}</button>
                    </span></td>
                  </tr>
                } @empty { <tr><td colspan="5" class="vazio">Nenhum usuário cadastrado.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>

        <form class="card" [formGroup]="form" (ngSubmit)="salvar()" novalidate aria-labelledby="u-form">
          <h2 id="u-form">{{ editandoId() ? 'Editar usuário' : 'Novo usuário' }}</h2>
          <div class="campo"><label for="u-nome">Nome</label>
            <input id="u-nome" type="text" formControlName="nome" maxlength="100" [attr.aria-invalid]="inv('nome')" />
            @if (inv('nome')) { <span class="erro-campo">Informe o nome.</span> }</div>
          <div class="campo"><label for="u-email">E-mail</label>
            <input id="u-email" type="email" formControlName="email" maxlength="150" placeholder="nome@empresa.com" autocomplete="off" [attr.aria-invalid]="inv('email')" />
            @if (inv('email')) { <span class="erro-campo">Informe um e-mail válido.</span> }</div>
          <div class="campo"><label for="u-senha">Senha</label>
            <input id="u-senha" type="password" formControlName="senha" autocomplete="new-password" aria-describedby="u-senha-aj" [attr.aria-invalid]="inv('senha')" />
            <span id="u-senha-aj" class="ajuda">Ao editar, deixe em branco para manter a senha atual.</span>
            @if (inv('senha')) { <span class="erro-campo">Informe a senha do novo usuário.</span> }</div>
          <div class="campo"><label for="u-perfil">Perfil</label>
            <select id="u-perfil" formControlName="perfil">
              <option value="OPERADOR">Feirante / operador</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select></div>
          <div class="campo"><span class="rotulo-grupo" id="u-sit">Situação</span>
            <div class="opcoes" role="radiogroup" aria-labelledby="u-sit">
              <label class="opcao"><input type="radio" formControlName="ativo" [value]="true" /> Ativo</label>
              <label class="opcao"><input type="radio" formControlName="ativo" [value]="false" /> Inativo</label>
            </div></div>
          <div class="rodape-form">
            <button type="button" class="btn" (click)="novo()">Cancelar</button>
            <button type="submit" class="btn primario" [disabled]="salvando()">{{ salvando() ? 'Salvando…' : 'Salvar usuário' }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class UsuariosComponent implements OnInit {
  private api = inject(UsuarioService);

  lista = signal<Usuario[]>([]);
  editandoId = signal<number | null>(null);
  erro = signal(''); sucesso = signal('');
  salvando = signal(false);
  private tentou = false;

  form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    senha: [''],
    perfil: ['OPERADOR' as Perfil],
    ativo: [true],
  });

  ngOnInit() { this.carregar(); }
  carregar() { this.api.listar().subscribe({ next: l => this.lista.set(l), error: e => this.erro.set(mensagemErro(e)) }); }

  inv(c: 'nome' | 'email' | 'senha') {
    const x = this.form.controls[c];
    if (c === 'senha') return (this.tentou || x.touched) && !this.editandoId() && !x.value.trim();
    return x.invalid && (x.touched || this.tentou);
  }

  novo() {
    this.editandoId.set(null); this.tentou = false; this.erro.set('');
    this.form.reset({ nome: '', email: '', senha: '', perfil: 'OPERADOR', ativo: true });
  }
  editar(u: Usuario) {
    this.sucesso.set(''); this.erro.set(''); this.tentou = false;
    this.editandoId.set(u.id);
    this.form.reset({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil, ativo: u.ativo });
  }

  alternar(u: Usuario) {
    this.erro.set(''); this.sucesso.set('');
    this.api.definirAtivo(u.id, !u.ativo).subscribe({ next: () => this.carregar(), error: e => this.erro.set(mensagemErro(e)) });
  }

  salvar() {
    this.tentou = true; this.erro.set(''); this.sucesso.set('');
    const v = this.form.getRawValue(), id = this.editandoId();
    if (this.form.invalid || this.inv('senha')) { this.form.markAllAsTouched(); return; }
    const corpo = { nome: v.nome.trim(), email: v.email.trim(), perfil: v.perfil, ativo: v.ativo, ...(v.senha.trim() ? { senha: v.senha } : {}) };
    this.salvando.set(true);
    (id ? this.api.atualizar(id, corpo) : this.api.criar(corpo)).subscribe({
      next: salvo => {
        // o backend sempre cria usuário como ativo; se o admin escolheu "Inativo", desativa em seguida
        const fim = () => { this.salvando.set(false); this.sucesso.set('Usuário salvo.'); this.novo(); this.carregar(); };
        if (salvo.ativo !== v.ativo) this.api.definirAtivo(salvo.id, v.ativo).subscribe({ next: fim, error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); } });
        else fim();
      },
      error: e => { this.salvando.set(false); this.erro.set(mensagemErro(e)); },
    });
  }
}
