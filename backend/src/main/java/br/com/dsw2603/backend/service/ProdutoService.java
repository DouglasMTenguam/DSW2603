package br.com.dsw2603.backend.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Categoria;
import br.com.dsw2603.backend.model.entity.Produto;
import br.com.dsw2603.backend.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class ProdutoService {

    private static final Set<String> UNIDADES = Set.of("kg", "unidade", "maço", "caixa");

    private final ProdutoRepository repository;
    private final CategoriaService service;

    private Categoria validar(Produto p) {
        if (p.getNome() == null || p.getNome().isBlank() || p.getUnidadeMedida() == null
                || p.getCategoria() == null || p.getCategoria().getId() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nome, categoria e unidade de medida são obrigatórios");
        if (!UNIDADES.contains(p.getUnidadeMedida()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unidade de medida inválida (kg, unidade, maço ou caixa)");
        if (p.getEstoqueMinimo() == null || p.getEstoqueMinimo().compareTo(BigDecimal.ZERO) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Estoque mínimo deve ser igual ou maior que zero");
        if (p.getCustoReferencia() == null || p.getCustoReferencia().compareTo(BigDecimal.ZERO) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custo de referência não pode ser negativo");
        Categoria categoria = service.buscar(p.getCategoria().getId());
        if (!Boolean.TRUE.equals(categoria.getAtivo()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A categoria precisa estar ativa");
        return categoria;
    }

    public Produto criar(Produto produto) {
        Categoria categoria = validar(produto);
        BigDecimal estoque = produto.getEstoqueAtual() == null ? BigDecimal.ZERO : produto.getEstoqueAtual();
        if (estoque.compareTo(BigDecimal.ZERO) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O estoque inicial não pode ser negativo");
        produto.setId(null);
        produto.setCategoria(categoria);
        produto.setEstoqueAtual(estoque);
        produto.setAtivo(true);
        return repository.save(produto);
    }

    public List<Produto> listar(String nome, Integer categoriaId) {
        String texto = (nome == null) ? "" : nome.trim();
        if (categoriaId == null)
            return repository.findByNomeContainingIgnoreCaseOrderByNome(texto);
        return repository.findByNomeContainingIgnoreCaseAndCategoriaIdOrderByNome(texto, categoriaId);
    }

    public Produto buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }

    public Produto atualizar(Integer id, Produto dados) {
        Categoria categoria = validar(dados);
        Produto produto = buscar(id);
        produto.setNome(dados.getNome());
        produto.setUnidadeMedida(dados.getUnidadeMedida());
        produto.setEstoqueMinimo(dados.getEstoqueMinimo());
        produto.setCustoReferencia(dados.getCustoReferencia());
        produto.setCategoria(categoria);
        return repository.save(produto);
    }

    public Produto desativar(Integer id) {
        Produto produto = buscar(id);
        produto.setAtivo(false);
        return repository.save(produto);
    }

    public Produto ativar(Integer id) {
        Produto produto = buscar(id);
        produto.setAtivo(true);
        return repository.save(produto);
    }
}
