package br.com.dsw2603.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.Categoria;
import br.com.dsw2603.backend.service.CategoriaService;
import jakarta.validation.Valid;

@RestController 
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;
    
    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping 
    public List<Categoria> listarCategorias() {
        return categoriaService.listarCategorias();
    }

    @GetMapping("/{id}")
    public Categoria buscarCategoriaPorId(@PathVariable Integer id) {
        return categoriaService.buscarCategoriaPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria criarCategoria(@Valid @RequestBody Categoria categoria) {
        return categoriaService.criarCategoria(categoria);
    }

    @PutMapping("/{id}")
    public Categoria atualizarCategoria(@PathVariable Integer id, @Valid @RequestBody Categoria categoriaAtualizada) {
        return categoriaService.atualizarCategoria(id, categoriaAtualizada);
    }

    @PatchMapping("/{id}/desativar")
    public Categoria desativarCategoria(@PathVariable Integer id) {
        return categoriaService.desativarCategoria(id);
    }
    
}
