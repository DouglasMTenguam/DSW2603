package br.com.dsw2603.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.entity.Usuario;
import br.com.dsw2603.backend.service.UsuarioService;
import br.com.dsw2603.backend.util.SomenteAdmin;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public Usuario buscarLogado(@RequestAttribute Integer usuarioId) {
        return service.buscar(usuarioId);
    }

    @SomenteAdmin
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario criar(@RequestBody Usuario usuario) {
        return service.criar(usuario);
    }

    @SomenteAdmin
    @GetMapping
    public List<Usuario> listar() {
        return service.listar();
    }

    @SomenteAdmin
    @GetMapping("/{id}")
    public Usuario buscar(@PathVariable Integer id) {
        return service.buscar(id);
    }

    @SomenteAdmin
    @PutMapping("/{id}")
    public Usuario atualizar(@PathVariable Integer id, @RequestBody Usuario usuario) {
        return service.atualizar(id, usuario);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/desativar")
    public Usuario desativar(@PathVariable Integer id) {
        return service.desativar(id);
    }

    @SomenteAdmin
    @PatchMapping("/{id}/ativar")
    public Usuario ativar(@PathVariable Integer id) {
        return service.ativar(id);
    }
}
