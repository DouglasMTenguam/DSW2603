package br.com.dsw2603.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.model.entity.Compra;
import br.com.dsw2603.backend.model.entity.ItemCompra;
import br.com.dsw2603.backend.model.request.CompraRequest;
import br.com.dsw2603.backend.service.CompraService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/compras")
@RequiredArgsConstructor
public class CompraController {

    private final CompraService service;

    // registra a compra como PENDENTE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Compra criar(@RequestAttribute Integer usuarioId, @RequestBody CompraRequest compra) {
        return service.criar(usuarioId, compra);
    }

    // confirma o recebimento: aumenta o estoque e registra as entradas (RN14)
    @PostMapping("/{id}/receber")
    public Compra receber(@RequestAttribute Integer usuarioId, @PathVariable Integer id) {
        return service.receber(usuarioId, id);
    }

    // ?inicio=2026-10-01&fim=2026-10-31 (opcional)
    @GetMapping
    public List<Compra> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.listar(inicio, fim);
    }

    @GetMapping("/{id}")
    public Compra buscar(@PathVariable Integer id) {
        return service.buscar(id);
    }

    @GetMapping("/{id}/itens")
    public List<ItemCompra> itens(@PathVariable Integer id) {
        return service.itens(id);
    }
}
