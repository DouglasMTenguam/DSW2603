package br.com.dsw2603.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.request.LoginRequest;
import br.com.dsw2603.backend.service.UsuarioService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest req) {
        return usuarioService.login(req);
    }
}
