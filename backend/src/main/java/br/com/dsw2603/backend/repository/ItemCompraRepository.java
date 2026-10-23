package br.com.dsw2603.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.dsw2603.backend.model.entity.ItemCompra;

public interface ItemCompraRepository extends JpaRepository<ItemCompra, Integer> {

    List<ItemCompra> findByCompraId(Integer compraId);
}
