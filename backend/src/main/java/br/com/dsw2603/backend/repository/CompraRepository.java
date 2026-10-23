package br.com.dsw2603.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.entity.Compra;

public interface CompraRepository extends JpaRepository<Compra, Integer> {

    List<Compra> findAllByOrderByDataCompraDescIdDesc();

    List<Compra> findByDataCompraBetweenOrderByDataCompraDescIdDesc(LocalDate inicio, LocalDate fim);
}
