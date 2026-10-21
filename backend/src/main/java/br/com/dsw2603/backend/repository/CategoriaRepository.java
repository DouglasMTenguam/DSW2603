package br.com.dsw2603.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Integer id);
    
}