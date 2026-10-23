package br.com.dsw2603.backend.model.request;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class CompraRequest {

    private LocalDate dataCompra;

    private Integer idFornecedor;

    private List<ItemCompraRequest> itens;
}
