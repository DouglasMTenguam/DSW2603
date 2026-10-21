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

import br.com.dsw2603.backend.model.entity.Categoria;
import br.com.dsw2603.backend.service.CategoriaService;
import br.com.dsw2603.backend.util.SomenteAdmin;

@RestController 
@RequestMapping ("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;
    
    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping 
    public List<Categoria> listarCategorias() {
        return categoriaService.listar();
    }

    @GetMapping("/{id}")
    public Categoria buscarCategoriaPorId(@PathVariable Integer id) {
        return categoriaService.buscar(id);
    }

    @SomenteAdmin
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria criarCategoria(@RequestBody Categoria categoria) {
        return categoriaService.criar(categoria);
    }

    @SomenteAdmin
    @PutMapping("/{id}")
    public Categoria atualizarCategoria(@PathVariable Integer id, @RequestBody Categoria categoriaAtualizada) {
        return categoriaService.atualizar(id, categoriaAtualizada);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/desativar")
    public Categoria desativarCategoria(@PathVariable Integer id) {
        return categoriaService.desativar(id);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/ativar")
    public Categoria ativarCategoria(@PathVariable Integer id) {
        return categoriaService.ativar(id);
    }

}
