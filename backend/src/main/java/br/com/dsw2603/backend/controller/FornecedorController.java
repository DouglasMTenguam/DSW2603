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

import br.com.dsw2603.backend.model.entity.Fornecedor;
import br.com.dsw2603.backend.service.FornecedorService;
import br.com.dsw2603.backend.util.SomenteAdmin;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fornecedores")
@RequiredArgsConstructor
public class FornecedorController {

    private final FornecedorService service;

    // consultas: qualquer usuário logado (a tela de compras precisa escolher o fornecedor)
    @GetMapping
    public List<Fornecedor> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public Fornecedor buscar(@PathVariable Integer id) {
        return service.buscar(id);
    }

    // alterações: só o administrador (RN16)
    @SomenteAdmin
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Fornecedor criar(@RequestBody Fornecedor fornecedor) {
        return service.criar(fornecedor);
    }

    @SomenteAdmin
    @PutMapping("/{id}")
    public Fornecedor atualizar(@PathVariable Integer id, @RequestBody Fornecedor fornecedor) {
        return service.atualizar(id, fornecedor);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/desativar")
    public Fornecedor desativar(@PathVariable Integer id) {
        return service.desativar(id);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/ativar")
    public Fornecedor ativar(@PathVariable Integer id) {
        return service.ativar(id);
    }
}
