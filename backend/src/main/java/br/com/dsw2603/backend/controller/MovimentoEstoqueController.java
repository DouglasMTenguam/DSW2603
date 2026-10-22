package br.com.dsw2603.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.entity.MovimentoEstoque;
import br.com.dsw2603.backend.model.request.MovimentoRequest;
import br.com.dsw2603.backend.model.request.PerdaRequest;
import br.com.dsw2603.backend.service.MovimentoEstoqueService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/movimentos")
@RequiredArgsConstructor
public class MovimentoEstoqueController {

    private final MovimentoEstoqueService service;

    // ?inicio=2026-10-01&fim=2026-10-31&produtoId=1&tipo=PERDA (todos opcionais)
    @GetMapping
    public List<MovimentoEstoque> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) Integer produtoId,
            @RequestParam(required = false) String tipo) {
        return service.listar(inicio, fim, produtoId, tipo);
    }

    // Tela 5 - registrar movimentação
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentoEstoque registrar(@RequestAttribute Integer usuarioId, @RequestBody MovimentoRequest req) {
        return service.registrar(usuarioId, req);
    }

    // Tela 8 - registrar perda
    @PostMapping("/perdas")
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentoEstoque registrarPerda(@RequestAttribute Integer usuarioId, @RequestBody PerdaRequest req) {
        return service.registrarPerda(usuarioId, req);
    }
}
