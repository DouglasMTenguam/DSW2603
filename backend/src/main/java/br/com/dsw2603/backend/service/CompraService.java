package br.com.dsw2603.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Compra;
import br.com.dsw2603.backend.model.entity.Fornecedor;
import br.com.dsw2603.backend.model.entity.ItemCompra;
import br.com.dsw2603.backend.model.entity.Produto;
import br.com.dsw2603.backend.model.request.CompraRequest;
import br.com.dsw2603.backend.model.request.ItemCompraRequest;
import br.com.dsw2603.backend.repository.CompraRepository;
import br.com.dsw2603.backend.repository.ItemCompraRepository;
import br.com.dsw2603.backend.util.Constantes;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final CompraRepository repository;
    private final ItemCompraRepository itemRepository;
    private final FornecedorService fornecedorService;
    private final ProdutoService produtoService;
    private final UsuarioService usuarioService;
    private final MovimentoEstoqueService movimentoService;

    // registra a compra como PENDENTE; o estoque só muda quando o recebimento é confirmado
    @Transactional
    public Compra criar(Integer usuarioId, CompraRequest req) {
        // RN11 - fornecedor, data e pelo menos um item
        if (req.getDataCompra() == null || req.getIdFornecedor() == null
                || req.getItens() == null || req.getItens().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fornecedor, data e pelo menos um item são obrigatórios");
        Fornecedor fornecedor = fornecedorService.buscar(req.getIdFornecedor());
        if (!Boolean.TRUE.equals(fornecedor.getAtivo()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fornecedor inativo");

        List<ItemCompra> itens = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (ItemCompraRequest ir : req.getItens()) {
            if (ir.getIdProduto() == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o produto de cada item");
            // RN12 - quantidade e custo unitário maiores que zero
            if (ir.getQuantidade() == null || ir.getQuantidade().compareTo(BigDecimal.ZERO) <= 0
                    || ir.getCustoUnitario() == null || ir.getCustoUnitario().compareTo(BigDecimal.ZERO) <= 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Quantidade e custo unitário devem ser maiores que zero");
            Produto produto = produtoService.buscar(ir.getIdProduto());
            if (!Boolean.TRUE.equals(produto.getAtivo()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto inativo: " + produto.getNome());

            ItemCompra item = new ItemCompra();
            item.setProduto(produto);
            item.setQuantidade(ir.getQuantidade());
            item.setCustoUnitario(ir.getCustoUnitario());
            // RN13 - o sistema calcula o subtotal e o total (valores enviados pelo cliente são ignorados)
            BigDecimal subtotal = ir.getQuantidade().multiply(ir.getCustoUnitario()).setScale(2, RoundingMode.HALF_UP);
            item.setSubtotal(subtotal);
            total = total.add(subtotal);
            itens.add(item);
        }

        Compra compra = new Compra();
        compra.setDataCompra(req.getDataCompra());
        compra.setFornecedor(fornecedor);
        compra.setUsuario(usuarioService.buscar(usuarioId));
        compra.setStatus(Constantes.PENDENTE);
        compra.setValorTotal(total);
        compra = repository.save(compra);
        for (ItemCompra item : itens)
            item.setCompra(compra);
        itemRepository.saveAll(itens);
        return compra;
    }

    // RN14 - confirma o recebimento: aumenta o estoque e registra as entradas, sem duplicar
    @Transactional
    public Compra receber(Integer usuarioId, Integer id) {
        Compra compra = buscar(id);
        if (Constantes.RECEBIDA.equals(compra.getStatus()))
            return compra; // já recebida: não faz nada de novo
        for (ItemCompra item : itemRepository.findByCompraId(id)) {
            movimentoService.aplicar(usuarioId, item.getProduto().getId(), Constantes.ENTRADA,
                    item.getQuantidade(), true, "Recebimento da compra #" + id, compra);
        }
        compra.setStatus(Constantes.RECEBIDA);
        return repository.save(compra);
    }

    // sem período: devolve todas (inicio e fim são opcionais, mas devem vir juntos)
    public List<Compra> listar(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null)
            return repository.findAllByOrderByDataCompraDescIdDesc();
        return repository.findByDataCompraBetweenOrderByDataCompraDescIdDesc(inicio, fim);
    }

    public Compra buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra não encontrada"));
    }

    public List<ItemCompra> itens(Integer id) {
        buscar(id);
        return itemRepository.findByCompraId(id);
    }
}
