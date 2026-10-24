package br.com.dsw2603.backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.service.DashboardService;
import br.com.dsw2603.backend.service.RelatorioService;
import br.com.dsw2603.backend.util.SomenteAdmin;
import lombok.RequiredArgsConstructor;

// relatórios: só o administrador (RN16)
@SomenteAdmin
@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService service;
    private final DashboardService dashboardService;

    // ?inicio=2026-10-01&fim=2026-10-31 (opcional; sem período usa o mês atual)
    @GetMapping("/resumo")
    public Map<String, Object> resumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.resumo(inicio, fim);
    }

    @GetMapping("/perdas")
    public Map<String, Object> perdas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.perdas(inicio, fim);
    }

    // produtos que mais precisam de reposição
    @GetMapping("/reposicao")
    public List<Map<String, Object>> reposicao() {
        return dashboardService.alertas();
    }
}
