package br.com.dsw2603.backend.model.request;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MovimentoRequest {

    private Integer idProduto;

    // ENTRADA, SAIDA, PERDA ou AJUSTE
    private String tipo;

    private BigDecimal quantidade;

    // obrigatório em perdas e ajustes (RN10)
    private String motivo;

    // só para AJUSTE: true aumenta o estoque, false reduz
    private Boolean aumentar;
}
