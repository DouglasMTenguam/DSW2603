package br.com.dsw2603.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Compra;
import br.com.dsw2603.backend.model.entity.MovimentoEstoque;
import br.com.dsw2603.backend.model.entity.Produto;
import br.com.dsw2603.backend.model.request.MovimentoRequest;
import br.com.dsw2603.backend.model.request.PerdaRequest;
import br.com.dsw2603.backend.repository.MovimentoEstoqueRepository;
import br.com.dsw2603.backend.repository.ProdutoRepository;
import br.com.dsw2603.backend.util.Constantes;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovimentoEstoqueService {

    private final MovimentoEstoqueRepository repository;
    private final ProdutoRepository produtoRepository;
    private final UsuarioService usuarioService;

    // inicio, fim, produtoId e tipo são opcionais (sem período, devolve todo o histórico)
    public List<MovimentoEstoque> listar(LocalDate inicio, LocalDate fim, Integer produtoId, String tipo) {
        LocalDate de = (inicio == null) ? LocalDate.of(2000, 1, 1) : inicio;
        LocalDate ate = (fim == null) ? LocalDate.now() : fim;
        return repository
                .findByDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraDescIdDesc(
                        de.atStartOfDay(), ate.plusDays(1).atStartOfDay())
                .stream()
                .filter(m -> produtoId == null || m.getProduto().getId().equals(produtoId))
                .filter(m -> tipo == null || m.getTipo().equalsIgnoreCase(tipo))
                .toList();
    }

    // movimentação manual: ENTRADA, SAIDA, PERDA ou AJUSTE
    @Transactional
    public MovimentoEstoque registrar(Integer usuarioId, MovimentoRequest req) {
        if (req.getIdProduto() == null || req.getTipo() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o produto e o tipo da movimentação");
        // RN06 - quantidade maior que zero
        if (req.getQuantidade() == null || req.getQuantidade().compareTo(BigDecimal.ZERO) <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior que zero");

        String tipo = req.getTipo().toUpperCase();
        String motivo = (req.getMotivo() == null) ? "" : req.getMotivo().trim();
        boolean aumenta;
        if (tipo.equals(Constantes.ENTRADA)) {
            aumenta = true;
        } else if (tipo.equals(Constantes.SAIDA)) {
            aumenta = false;
        } else if (tipo.equals(Constantes.PERDA)) {
            // RN10 - toda perda tem motivo
            if (motivo.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o motivo da perda");
            aumenta = false;
        } else if (tipo.equals(Constantes.AJUSTE)) {
            if (req.getAumentar() == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Informe se o ajuste aumenta ou reduz o estoque");
            if (motivo.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o motivo do ajuste");
            aumenta = req.getAumentar();
            // o banco guarda só a quantidade (sempre positiva); o sentido fica registrado no motivo
            motivo = (aumenta ? "Aumento: " : "Redução: ") + motivo;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tipo deve ser ENTRADA, SAIDA, PERDA ou AJUSTE");
        }
        return aplicar(usuarioId, req.getIdProduto(), tipo, req.getQuantidade(), aumenta,
                motivo.isEmpty() ? null : motivo, null);
    }

    // Tela 8 - registro de perdas
    @Transactional
    public MovimentoEstoque registrarPerda(Integer usuarioId, PerdaRequest req) {
        String motivo = (req.getMotivo() == null) ? "" : req.getMotivo().trim();
        if (!motivo.isEmpty() && req.getTipoPerda() != null && !req.getTipoPerda().isBlank())
            motivo = req.getTipoPerda().trim().toUpperCase() + ": " + motivo;
        MovimentoRequest mov = new MovimentoRequest();
        mov.setIdProduto(req.getIdProduto());
        mov.setTipo(Constantes.PERDA);
        mov.setQuantidade(req.getQuantidade());
        mov.setMotivo(motivo);
        return registrar(usuarioId, mov);
    }

    /**
     * Altera o estoque do produto e grava a movimentação (RN06, RN07, RN08).
     * Também é usado pelo recebimento de compras.
     */
    @Transactional
    public MovimentoEstoque aplicar(Integer usuarioId, Integer idProduto, String tipo, BigDecimal quantidade,
                                    boolean aumenta, String motivo, Compra compra) {
        Produto produto = produtoRepository.findById(idProduto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
        if (!Boolean.TRUE.equals(produto.getAtivo()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto inativo");

        BigDecimal atual = produto.getEstoqueAtual();
        BigDecimal novo = aumenta ? atual.add(quantidade) : atual.subtract(quantidade);
        // RN07 - nunca deixa o estoque negativo; nesse caso nada é alterado
        if (novo.compareTo(BigDecimal.ZERO) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Estoque insuficiente (disponível: " + atual.stripTrailingZeros().toPlainString() + ")");
        produto.setEstoqueAtual(novo);
        produtoRepository.save(produto);

        MovimentoEstoque mov = new MovimentoEstoque();
        mov.setProduto(produto);
        mov.setUsuario(usuarioService.buscar(usuarioId));
        mov.setCompra(compra);
        mov.setTipo(tipo);
        mov.setQuantidade(quantidade);
        mov.setDataHora(LocalDateTime.now());
        mov.setMotivo(motivo);
        return repository.save(mov);
    }
}
