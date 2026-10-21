package br.com.dsw2603.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.entity.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    List<Produto> findByNomeContainingIgnoreCaseOrderByNome(String nome);

    List<Produto> findByNomeContainingIgnoreCaseAndCategoriaIdOrderByNome(String nome, Integer categoriaId);
}
