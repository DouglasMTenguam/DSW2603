package br.com.dsw2603.backend.model.request;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ItemCompraRequest {

    private Integer idProduto;

    private BigDecimal quantidade;

    private BigDecimal custoUnitario;
}
