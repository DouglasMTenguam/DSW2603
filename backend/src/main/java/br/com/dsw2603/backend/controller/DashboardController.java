package br.com.dsw2603.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.dsw2603.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/resumo")
    public Map<String, Object> resumo() {
        return service.resumo();
    }

    // estoque baixo (RN09) com reposição sugerida (RN19)
    @GetMapping("/alertas")
    public List<Map<String, Object>> alertas() {
        return service.alertas();
    }
}
