package br.com.dsw2603.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.entity.MovimentoEstoque;

public interface MovimentoEstoqueRepository extends JpaRepository<MovimentoEstoque, Integer> {

    // período: inicio inclusive, fim exclusivo
    List<MovimentoEstoque> findByDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraDescIdDesc(
            LocalDateTime inicio, LocalDateTime fim);

    List<MovimentoEstoque> findByTipoAndDataHoraGreaterThanEqualAndDataHoraLessThan(
            String tipo, LocalDateTime inicio, LocalDateTime fim);
}
