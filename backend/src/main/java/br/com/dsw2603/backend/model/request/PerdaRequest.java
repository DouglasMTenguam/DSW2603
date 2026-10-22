package br.com.dsw2603.backend.model.request;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class PerdaRequest {

    private Integer idProduto;

    private BigDecimal quantidade;

    // ESTRAGADO, DANIFICADO ou DESCARTADO (opcional)
    private String tipoPerda;

    // obrigatório (RN10)
    private String motivo;
}
