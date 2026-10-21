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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.entity.Produto;
import br.com.dsw2603.backend.service.ProdutoService;
import br.com.dsw2603.backend.util.SomenteAdmin;

@RestController 
@RequestMapping ("/produtos")
public class ProdutoController {

    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    @GetMapping 
    public List<Produto> listar(@RequestParam (required = false) String nome, @RequestParam(required = false) Integer categoriaId) {
        return service.listar(nome, categoriaId);
    }

    @GetMapping ("/{id}")
    public Produto buscar(@PathVariable Integer id) {
        return service.buscar(id);
    }

    @SomenteAdmin
    @PostMapping 
    @ResponseStatus(HttpStatus.CREATED)
    public Produto criar(@RequestBody Produto produto) {
        return service.criar(produto);
    }

    @SomenteAdmin
    @PutMapping("/{id}")
    public Produto atualizar(@PathVariable Integer id, @RequestBody Produto produto) {
        return service.atualizar(id, produto);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/desativar")
    public Produto desativar(@PathVariable Integer id) {
        return service.desativar(id);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/ativar")
    public Produto ativar(@PathVariable Integer id) {
        return service.ativar(id);
    }

}
