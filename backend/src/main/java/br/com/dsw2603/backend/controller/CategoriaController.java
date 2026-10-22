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
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService service;

    // consultas: qualquer usuário logado (os formulários precisam da lista)
    @GetMapping
    public List<Categoria> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public Categoria buscar(@PathVariable Integer id) {
        return service.buscar(id);
    }

    // alterações: só o administrador (RN16)
    @SomenteAdmin
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria criar(@RequestBody Categoria categoria) {
        return service.criar(categoria);
    }

    @SomenteAdmin
    @PutMapping("/{id}")
    public Categoria atualizar(@PathVariable Integer id, @RequestBody Categoria categoria) {
        return service.atualizar(id, categoria);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/desativar")
    public Categoria desativar(@PathVariable Integer id) {
        return service.desativar(id);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/ativar")
    public Categoria ativar(@PathVariable Integer id) {
        return service.ativar(id);
    }
}
