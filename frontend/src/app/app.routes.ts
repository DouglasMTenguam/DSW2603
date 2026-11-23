import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'estoque', title: 'Estoque e movimentações', loadComponent: () => import('./pages/estoque/movimentacoes.component').then(m => m.MovimentacoesComponent) },
      { path: 'compras', title: 'Compras e recebimento', loadComponent: () => import('./pages/compras/compras.component').then(m => m.ComprasComponent) },
      { path: 'perdas', title: 'Registro de perdas', loadComponent: () => import('./pages/perdas/perdas.component').then(m => m.PerdasComponent) },
      { path: 'produtos', title: 'Produtos', loadComponent: () => import('./pages/produtos/produtos.component').then(m => m.ProdutosComponent) },
      { path: 'produtos/novo', title: 'Novo produto', canActivate: [adminGuard], loadComponent: () => import('./pages/produtos/produto-form.component').then(m => m.ProdutoFormComponent) },
      { path: 'produtos/:id/editar', title: 'Editar produto', canActivate: [adminGuard], loadComponent: () => import('./pages/produtos/produto-form.component').then(m => m.ProdutoFormComponent) },
      { path: 'fornecedores', title: 'Fornecedores', loadComponent: () => import('./pages/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent) },
      { path: 'relatorios', title: 'Relatórios', canActivate: [adminGuard], loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent) },
      { path: 'usuarios', title: 'Usuários', canActivate: [adminGuard], loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
