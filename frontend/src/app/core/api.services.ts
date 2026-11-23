import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api.config';
import {
  Alerta, Categoria, Compra, CompraForm, FiltroMovimento, Fornecedor, FornecedorForm, ItemCompra,
  Movimento, MovimentoForm, PerdaForm, PerdasRelatorio, Produto, ProdutoForm, ResumoDashboard,
  ResumoRelatorio, Usuario, UsuarioForm,
} from './models';

function params(o: Record<string, unknown>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
  return p;
}
const sufixo = (ativo: boolean) => (ativo ? 'ativar' : 'desativar');

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private http = inject(HttpClient);
  listar() { return this.http.get<Produto[]>(`${API_URL}/produtos`); }
  buscar(id: number) { return this.http.get<Produto>(`${API_URL}/produtos/${id}`); }
  criar(f: ProdutoForm) { return this.http.post<Produto>(`${API_URL}/produtos`, f); }
  atualizar(id: number, f: ProdutoForm) { return this.http.put<Produto>(`${API_URL}/produtos/${id}`, f); }
  definirAtivo(id: number, ativo: boolean) { return this.http.patch<Produto>(`${API_URL}/produtos/${id}/${sufixo(ativo)}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  listar() { return this.http.get<Categoria[]>(`${API_URL}/categorias`); }
  criar(nome: string) { return this.http.post<Categoria>(`${API_URL}/categorias`, { nome }); }
}

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private http = inject(HttpClient);
  listar() { return this.http.get<Fornecedor[]>(`${API_URL}/fornecedores`); }
  criar(f: FornecedorForm) { return this.http.post<Fornecedor>(`${API_URL}/fornecedores`, f); }
  atualizar(id: number, f: FornecedorForm) { return this.http.put<Fornecedor>(`${API_URL}/fornecedores/${id}`, f); }
  definirAtivo(id: number, ativo: boolean) { return this.http.patch<Fornecedor>(`${API_URL}/fornecedores/${id}/${sufixo(ativo)}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  listar() { return this.http.get<Usuario[]>(`${API_URL}/usuarios`); }
  criar(f: UsuarioForm) { return this.http.post<Usuario>(`${API_URL}/usuarios`, f); }
  atualizar(id: number, f: UsuarioForm) { return this.http.put<Usuario>(`${API_URL}/usuarios/${id}`, f); }
  definirAtivo(id: number, ativo: boolean) { return this.http.patch<Usuario>(`${API_URL}/usuarios/${id}/${sufixo(ativo)}`, {}); }
}

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private http = inject(HttpClient);
  movimentos(f: FiltroMovimento) { return this.http.get<Movimento[]>(`${API_URL}/movimentos`, { params: params({ ...f }) }); }
  registrarMovimento(f: MovimentoForm) { return this.http.post<Movimento>(`${API_URL}/movimentos`, f); }
  registrarPerda(f: PerdaForm) { return this.http.post<Movimento>(`${API_URL}/movimentos/perdas`, f); }
}

@Injectable({ providedIn: 'root' })
export class CompraService {
  private http = inject(HttpClient);
  listar(inicio?: string, fim?: string) { return this.http.get<Compra[]>(`${API_URL}/compras`, { params: params({ inicio, fim }) }); }
  itens(id: number) { return this.http.get<ItemCompra[]>(`${API_URL}/compras/${id}/itens`); }
  /** Registra como PENDENTE; o estoque só muda em receber(). */
  criar(f: CompraForm) { return this.http.post<Compra>(`${API_URL}/compras`, f); }
  receber(id: number) { return this.http.post<Compra>(`${API_URL}/compras/${id}/receber`, {}); }
}

@Injectable({ providedIn: 'root' })
export class PainelService {
  private http = inject(HttpClient);
  resumo() { return this.http.get<ResumoDashboard>(`${API_URL}/dashboard/resumo`); }
  alertas() { return this.http.get<Alerta[]>(`${API_URL}/dashboard/alertas`); }
  // somente ADMINISTRADOR
  relatorioResumo(inicio: string, fim: string) { return this.http.get<ResumoRelatorio>(`${API_URL}/relatorios/resumo`, { params: params({ inicio, fim }) }); }
  relatorioPerdas(inicio: string, fim: string) { return this.http.get<PerdasRelatorio>(`${API_URL}/relatorios/perdas`, { params: params({ inicio, fim }) }); }
  relatorioReposicao() { return this.http.get<Alerta[]>(`${API_URL}/relatorios/reposicao`); }
}
