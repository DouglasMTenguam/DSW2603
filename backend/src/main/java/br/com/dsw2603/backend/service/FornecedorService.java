package br.com.dsw2603.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Fornecedor;
import br.com.dsw2603.backend.repository.FornecedorRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FornecedorService {

    private final FornecedorRepository repository;

    private void validar(Fornecedor f) {
        if (f.getNome() == null || f.getNome().isBlank() || f.getTelefone() == null
                || f.getTelefone().isBlank() || f.getContato() == null || f.getContato().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome, contato e telefone são obrigatórios");
    }

    public Fornecedor criar(Fornecedor fornecedor) {
        validar(fornecedor);
        fornecedor.setId(null);
        fornecedor.setAtivo(true);
        return repository.save(fornecedor);
    }

    public List<Fornecedor> listar() {
        return repository.findAll();
    }

    public Fornecedor buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado"));
    }

    public Fornecedor atualizar(Integer id, Fornecedor dados) {
        validar(dados);
        Fornecedor fornecedor = buscar(id);
        fornecedor.setNome(dados.getNome());
        fornecedor.setContato(dados.getContato());
        fornecedor.setTelefone(dados.getTelefone());
        return repository.save(fornecedor);
    }

    // RN18 - fornecedor não é apagado, é desativado
    public Fornecedor desativar(Integer id) {
        Fornecedor fornecedor = buscar(id);
        fornecedor.setAtivo(false);
        return repository.save(fornecedor);
    }

    public Fornecedor ativar(Integer id) {
        Fornecedor fornecedor = buscar(id);
        fornecedor.setAtivo(true);
        return repository.save(fornecedor);
    }
}
