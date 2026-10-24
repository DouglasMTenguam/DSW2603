package br.com.dsw2603.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import br.com.dsw2603.backend.model.entity.MovimentoEstoque;
import br.com.dsw2603.backend.repository.CompraRepository;
import br.com.dsw2603.backend.repository.MovimentoEstoqueRepository;
import br.com.dsw2603.backend.util.Constantes;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private static final Set<String> TIPOS_PERDA = Set.of("ESTRAGADO", "DANIFICADO", "DESCARTADO");

    private final MovimentoEstoqueRepository movimentoRepository;
    private final CompraRepository compraRepository;

    // sem período: do início do mês até hoje
    private LocalDate inicio(LocalDate inicio) {
        return (inicio == null) ? LocalDate.now().withDayOfMonth(1) : inicio;
    }

    private LocalDate fim(LocalDate fim) {
        return (fim == null) ? LocalDate.now() : fim;
    }

    private List<MovimentoEstoque> movimentos(String tipo, LocalDate de, LocalDate ate) {
        return movimentoRepository.findByTipoAndDataHoraGreaterThanEqualAndDataHoraLessThan(
                tipo, de.atStartOfDay(), ate.plusDays(1).atStartOfDay());
    }

    private BigDecimal somarQuantidade(List<MovimentoEstoque> lista) {
        return lista.stream().map(MovimentoEstoque::getQuantidade).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Map<String, Object> resumo(LocalDate inicio, LocalDate fim) {
        LocalDate de = inicio(inicio);
        LocalDate ate = fim(fim);
        List<MovimentoEstoque> perdas = movimentos(Constantes.PERDA, de, ate);
        // custo da perda = quantidade x custo de referência do produto
        BigDecimal custoPerdas = perdas.stream()
                .map(m -> m.getQuantidade().multiply(m.getProduto().getCustoReferencia()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // só compras já recebidas entram no gasto
        BigDecimal compras = compraRepository.findByDataCompraBetweenOrderByDataCompraDescIdDesc(de, ate).stream()
                .filter(c -> Constantes.RECEBIDA.equals(c.getStatus()))
                .map(c -> c.getValorTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("inicio", de);
        r.put("fim", ate);
        r.put("entradas", somarQuantidade(movimentos(Constantes.ENTRADA, de, ate)));
        r.put("saidas", somarQuantidade(movimentos(Constantes.SAIDA, de, ate)));
        r.put("compras", compras);
        r.put("perdasQuantidade", somarQuantidade(perdas));
        r.put("perdasCusto", custoPerdas);
        return r;
    }

    // perdas do período agrupadas por produto e por tipo (ESTRAGADO, DANIFICADO, DESCARTADO ou OUTROS)
    public Map<String, Object> perdas(LocalDate inicio, LocalDate fim) {
        LocalDate de = inicio(inicio);
        LocalDate ate = fim(fim);
        Map<String, BigDecimal> porProduto = new LinkedHashMap<>();
        Map<String, BigDecimal> porTipo = new LinkedHashMap<>();
        for (MovimentoEstoque m : movimentos(Constantes.PERDA, de, ate)) {
            porProduto.merge(m.getProduto().getNome(), m.getQuantidade(), BigDecimal::add);
            porTipo.merge(tipoDaPerda(m.getMotivo()), m.getQuantidade(), BigDecimal::add);
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("inicio", de);
        r.put("fim", ate);
        r.put("porProduto", ordenar(porProduto));
        r.put("porTipo", ordenar(porTipo));
        return r;
    }

    // o tipo da perda vem no começo do motivo, antes dos dois pontos ("ESTRAGADO: caiu no chão")
    private String tipoDaPerda(String motivo) {
        if (motivo != null && motivo.contains(":")) {
            String prefixo = motivo.substring(0, motivo.indexOf(':')).trim().toUpperCase();
            if (TIPOS_PERDA.contains(prefixo))
                return prefixo;
        }
        return "OUTROS";
    }

    // maior quantidade primeiro
    private Map<String, BigDecimal> ordenar(Map<String, BigDecimal> mapa) {
        Map<String, BigDecimal> ordenado = new LinkedHashMap<>();
        mapa.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(e -> ordenado.put(e.getKey(), e.getValue()));
        return ordenado;
    }
}
