export type Perfil = 'ADMINISTRADOR' | 'OPERADOR';
export type TipoMovimento = 'ENTRADA' | 'SAIDA' | 'PERDA' | 'AJUSTE';
export type TipoPerda = 'ESTRAGADO' | 'DANIFICADO' | 'DESCARTADO';

export interface Sessao { token: string; nome: string; perfil: Perfil; }

export interface Categoria { id: number; nome: string; ativo: boolean; }

export interface Produto {
  id: number; nome: string; unidadeMedida: string;
  estoqueAtual: number; estoqueMinimo: number; custoReferencia: number;
  ativo: boolean; categoria: Categoria;
}
export interface ProdutoForm {
  nome: string; unidadeMedida: string; estoqueMinimo: number; custoReferencia: number;
  categoria: { id: number };
}

export interface Fornecedor { id: number; nome: string; telefone: string; contato: string; ativo: boolean; }
export type FornecedorForm = Omit<Fornecedor, 'id'>;

export interface Usuario { id: number; nome: string; email: string; perfil: Perfil; ativo: boolean; }
export interface UsuarioForm { nome: string; email: string; senha?: string; perfil: Perfil; ativo: boolean; }

export interface Movimento {
  id: number; produto: Produto; usuario: Usuario; tipo: TipoMovimento;
  quantidade: number; dataHora: string; motivo: string | null;
}
export interface MovimentoForm {
  idProduto: number; tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; quantidade: number;
  motivo?: string; aumentar?: boolean;
}
export interface FiltroMovimento { inicio?: string; fim?: string; produtoId?: number | null; tipo?: string; }
export interface PerdaForm { idProduto: number; quantidade: number; tipoPerda: TipoPerda; motivo: string; }

export interface Compra {
  id: number; dataCompra: string; valorTotal: number; status: 'PENDENTE' | 'RECEBIDA';
  fornecedor: Fornecedor; usuario: Usuario;
}
export interface ItemCompra { id: number; produto: Produto; quantidade: number; custoUnitario: number; subtotal: number; }
export interface CompraForm {
  dataCompra: string; idFornecedor: number;
  itens: { idProduto: number; quantidade: number; custoUnitario: number }[];
}

export interface ResumoDashboard {
  valorEstoque: number; produtosEstoqueBaixo: number; comprasMes: number;
  perdasMesQuantidade: number; perdasMesCusto: number;
}
export interface Alerta {
  id: number; nome: string; unidadeMedida: string;
  estoqueAtual: number; estoqueMinimo: number; reposicaoSugerida: number;
}
export interface ResumoRelatorio {
  inicio: string; fim: string; entradas: number; saidas: number; compras: number;
  perdasQuantidade: number; perdasCusto: number;
}
export interface PerdasRelatorio { porProduto: Record<string, number>; porTipo: Record<string, number>; }
