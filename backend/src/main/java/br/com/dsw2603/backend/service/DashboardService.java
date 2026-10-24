package br.com.dsw2603.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import br.com.dsw2603.backend.model.entity.Produto;
import br.com.dsw2603.backend.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProdutoRepository produtoRepository;
    private final RelatorioService relatorioService;

    // RN09 - produtos ativos com estoque menor ou igual ao mínimo, os mais urgentes primeiro
    private List<Produto> estoqueBaixo() {
        return produtoRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getAtivo()))
                .filter(p -> p.getEstoqueAtual().compareTo(p.getEstoqueMinimo()) <= 0)
                .sorted(Comparator.comparing((Produto p) -> p.getEstoqueMinimo().subtract(p.getEstoqueAtual()))
                        .reversed())
                .toList();
    }

    // indicadores do mês atual, todos calculados a partir do banco
    public Map<String, Object> resumo() {
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);
        LocalDate fim = inicio.plusMonths(1).minusDays(1);
        Map<String, Object> mes = relatorioService.resumo(inicio, fim);

        // valor estimado em estoque = estoque atual x custo de referência
        BigDecimal valorEstoque = produtoRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getAtivo()))
                .map(p -> p.getEstoqueAtual().multiply(p.getCustoReferencia()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("valorEstoque", valorEstoque);
        r.put("produtosEstoqueBaixo", estoqueBaixo().size());
        r.put("comprasMes", mes.get("compras"));
        r.put("perdasMesQuantidade", mes.get("perdasQuantidade"));
        r.put("perdasMesCusto", mes.get("perdasCusto"));
        return r;
    }

    // estoque baixo com a reposição sugerida = mínimo - atual (RN19)
    public List<Map<String, Object>> alertas() {
        List<Map<String, Object>> lista = new ArrayList<>();
        for (Produto p : estoqueBaixo()) {
            BigDecimal falta = p.getEstoqueMinimo().subtract(p.getEstoqueAtual());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("nome", p.getNome());
            item.put("unidadeMedida", p.getUnidadeMedida());
            item.put("estoqueAtual", p.getEstoqueAtual());
            item.put("estoqueMinimo", p.getEstoqueMinimo());
            item.put("reposicaoSugerida", falta.signum() > 0 ? falta : BigDecimal.ZERO);
            lista.add(item);
        }
        return lista;
    }
}
