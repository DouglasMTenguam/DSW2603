package br.com.dsw2603.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import br.com.dsw2603.backend.model.Categoria;
import br.com.dsw2603.backend.repository.CategoriaRepository;

@Service 
public class CategoriaService {
    private final CategoriaRepository categoriaRepository;
    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    public Categoria buscarCategoriaPorId(Integer id) {
        return categoriaRepository.findById(id).orElseThrow(() -> new RuntimeException("Categoria não encontrada com o ID: " + id));
    }

    public Categoria criarCategoria(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    public Categoria atualizarCategoria(Integer id, Categoria categoriaAtualizada) {
        Categoria categoriaExistente = buscarCategoriaPorId(id);
        categoriaExistente.setNome(categoriaAtualizada.getNome());
        return categoriaRepository.save(categoriaExistente);
    }

    public Categoria desativarCategoria(Integer id) {
        Categoria categoriaExistente = buscarCategoriaPorId(id);
        categoriaExistente.setAtivo(false);
        return categoriaRepository.save(categoriaExistente);
    }

}
