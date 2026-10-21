package br.com.dsw2603.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Categoria;
import br.com.dsw2603.backend.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;

    private void validar(Categoria c, Integer idAtual){
        if (c.getNome() == null || c.getNome().isBlank())
            throw new RuntimeException("Nome da categoria é obrigatório");
        String nome = c.getNome().trim();
        boolean repetida = (idAtual == null) 
        ? repository.existsByNomeIgnoreCase(nome) 
        : repository.existsByNomeIgnoreCaseAndIdNot(nome, idAtual);
        if (repetida)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma categoria com esse nome");
    }

    public Categoria criar(Categoria categoria) {
        validar(categoria, null);
        categoria.setId(null);
        categoria.setNome(categoria.getNome().trim());
        categoria.setAtivo(true);
        return repository.save(categoria);
    }

    public List<Categoria> listar() {
        return repository.findAll();
    }

    public Categoria buscar(Integer id){
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    }

    public Categoria atualizar(Integer id, Categoria dados) {
        validar(dados, id);
        Categoria categoria = buscar(id);
        categoria.setNome(dados.getNome().trim());
        return repository.save(categoria);
    }

    public Categoria desativar(Integer id){
        Categoria categoria = buscar(id);
        categoria.setAtivo(false);
        return repository.save(categoria);
    }

    public Categoria ativar(Integer id){
        Categoria categoria = buscar(id);
        categoria.setAtivo(true);
        return repository.save(categoria);
    }

}
