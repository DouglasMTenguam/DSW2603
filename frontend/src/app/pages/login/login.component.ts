import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemErro } from '../../core/util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-fundo">
      <div class="login-card">
        <div class="marca">FeiraGestor</div>
        <h1>Entrar</h1>
        <p class="ajuda">Acesso para administradores e funcionários autorizados.</p>

        @if (erro()) { <div class="alerta erro" role="alert">{{ erro() }}</div> }

        <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <div class="campo">
            <label for="email">E-mail</label>
            <input id="email" type="email" formControlName="email" placeholder="nome@empresa.com" autocomplete="username"
                   [attr.aria-invalid]="invalido('email')" />
            @if (invalido('email')) { <span class="erro-campo">Informe um e-mail válido.</span> }
          </div>
          <div class="campo">
            <label for="senha">Senha</label>
            <input id="senha" type="password" formControlName="senha" autocomplete="current-password"
                   [attr.aria-invalid]="invalido('senha')" />
            @if (invalido('senha')) { <span class="erro-campo">Informe a senha.</span> }
          </div>
          <button class="btn primario" style="width:100%" type="submit" [disabled]="carregando()">
            {{ carregando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <p><button type="button" class="btn link" (click)="esqueci.set(!esqueci())">Esqueci minha senha</button></p>
        @if (esqueci()) {
          <p class="ajuda" role="status">Peça a um administrador para redefinir sua senha na tela de Usuários.</p>
        }
        <p class="ajuda">Depois de entrar, você vai direto para o painel do seu perfil.</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });
  erro = signal('');
  carregando = signal(false);
  esqueci = signal(false);
  private tentou = false;

  constructor() {
    if (this.auth.logado()) this.router.navigate(['/dashboard']);
  }

  invalido(c: 'email' | 'senha') {
    const ctrl = this.form.controls[c];
    return ctrl.invalid && (ctrl.touched || this.tentou);
  }

  entrar() {
    this.tentou = true;
    this.erro.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.carregando.set(true);
    const { email, senha } = this.form.getRawValue();
    this.auth.login(email, senha).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => { this.carregando.set(false); this.erro.set(mensagemErro(e, 'E-mail ou senha inválidos.')); },
    });
  }
}
