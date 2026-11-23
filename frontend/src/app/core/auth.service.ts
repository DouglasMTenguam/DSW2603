import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { API_URL, AUTH_URL } from './api.config';
import { Sessao, Usuario } from './models';

const CHAVE = 'feiragestor.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _sessao = signal<Sessao | null>(this.restaurar());
  readonly sessao = this._sessao.asReadonly();
  readonly logado = computed(() => !!this._sessao());
  readonly admin = computed(() => this._sessao()?.perfil === 'ADMINISTRADOR');

  get token(): string | null { return this._sessao()?.token ?? null; }

  /** POST /auth/login devolve só { token }; nome e perfil vêm de GET /api/usuarios/me. */
  login(email: string, senha: string) {
    return this.http.post<{ token: string }>(`${AUTH_URL}/login`, { email, senha }).pipe(
      switchMap(({ token }) =>
        this.http.get<Usuario>(`${API_URL}/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } }).pipe(
          map((u): Sessao => ({ token, nome: u.nome, perfil: u.perfil })),
        )),
      tap(s => { sessionStorage.setItem(CHAVE, JSON.stringify(s)); this._sessao.set(s); }),
    );
  }

  logout() {
    sessionStorage.removeItem(CHAVE);
    this._sessao.set(null);
    this.router.navigate(['/login']);
  }

  private restaurar(): Sessao | null {
    try { return JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null'); } catch { return null; }
  }
}
