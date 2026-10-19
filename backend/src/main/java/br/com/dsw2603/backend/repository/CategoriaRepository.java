package br.com.dsw2603.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    
}
