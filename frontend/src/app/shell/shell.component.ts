import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip" href="#conteudo">Ir para o conteúdo</a>
    <div class="layout">
      <aside class="lateral">
        <div class="marca">FeiraGestor</div>
        <nav aria-label="Menu principal">
          <a routerLink="/dashboard" routerLinkActive="ativo">Dashboard</a>
          <a routerLink="/estoque" routerLinkActive="ativo">Estoque</a>
          <a routerLink="/compras" routerLinkActive="ativo">Compras</a>
          <a routerLink="/perdas" routerLinkActive="ativo">Perdas</a>
          <a routerLink="/produtos" routerLinkActive="ativo">Produtos</a>
          <a routerLink="/fornecedores" routerLinkActive="ativo">Fornecedores</a>
          @if (auth.admin()) {
            <a routerLink="/relatorios" routerLinkActive="ativo">Relatórios</a>
            <a routerLink="/usuarios" routerLinkActive="ativo">Usuários</a>
          }
        </nav>
        <div class="usuario-box">
          <div class="nome">{{ auth.sessao()?.nome }}</div>
          <div class="perfil">{{ auth.admin() ? 'Administrador' : 'Feirante / operador' }}</div>
          <button type="button" class="btn pequeno" (click)="auth.logout()">Sair</button>
        </div>
      </aside>
      <main id="conteudo" tabindex="-1"><router-outlet /></main>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
}
