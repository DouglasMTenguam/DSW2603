package br.com.dsw2603.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.dsw2603.backend.model.entity.Usuario;
import br.com.dsw2603.backend.model.request.LoginRequest;
import br.com.dsw2603.backend.repository.UsuarioRepository;
import br.com.dsw2603.backend.util.Constantes;
import br.com.dsw2603.backend.util.JwtUtil;
import br.com.dsw2603.backend.util.Md5Util;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final JwtUtil jwtUtil = new JwtUtil();

    // nome, e-mail e perfil obrigatórios; e-mail único (RN17); senha só é obrigatória ao criar
    private void validar(Usuario u, Integer idAtual, boolean senhaObrigatoria) {
        if (u.getNome() == null || u.getNome().isBlank() || u.getEmail() == null
                || u.getEmail().isBlank() || u.getPerfil() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome, e-mail e perfil são obrigatórios");
        if (!Set.of(Constantes.ADMINISTRADOR, Constantes.OPERADOR).contains(u.getPerfil()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil deve ser ADMINISTRADOR ou OPERADOR");
        if (senhaObrigatoria && (u.getSenha() == null || u.getSenha().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha obrigatória");
        boolean repetido = (idAtual == null)
                ? repository.existsByEmail(u.getEmail())
                : repository.existsByEmailAndIdNot(u.getEmail(), idAtual);
        if (repetido)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
    }

    // o sistema nunca pode ficar sem administrador ativo
    private void garantirOutroAdmin(Usuario atual) {
        if (Constantes.ADMINISTRADOR.equals(atual.getPerfil()) && Boolean.TRUE.equals(atual.getAtivo())
                && repository.countByPerfilAndAtivoTrue(Constantes.ADMINISTRADOR) <= 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O sistema precisa de pelo menos um administrador ativo");
    }

    public Usuario criar(Usuario usuario) {
        validar(usuario, null, true);
        usuario.setId(null);
        usuario.setAtivo(true);
        usuario.setSenha(Md5Util.hash(usuario.getSenha()));
        return repository.save(usuario);
    }

    public Map<String, String> login(LoginRequest req) {
        if (req.getEmail() == null || req.getSenha() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe e-mail e senha");
        Usuario usuario = repository.findByEmail(req.getEmail())
                .filter(u -> u.getSenha().equals(Md5Util.hash(req.getSenha())))
                .filter(u -> Boolean.TRUE.equals(u.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));
        return Map.of("token", jwtUtil.gerarToken(usuario.getId(), usuario.getEmail(), usuario.getPerfil()));
    }

    public List<Usuario> listar() {
        return repository.findAll();
    }

    public Usuario buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    public Usuario atualizar(Integer id, Usuario dados) {
        validar(dados, id, false);
        Usuario usuario = buscar(id);
        boolean deixaDeSerAdminAtivo = !Constantes.ADMINISTRADOR.equals(dados.getPerfil())
                || Boolean.FALSE.equals(dados.getAtivo());
        if (deixaDeSerAdminAtivo)
            garantirOutroAdmin(usuario);
        usuario.setNome(dados.getNome());
        usuario.setEmail(dados.getEmail());
        usuario.setPerfil(dados.getPerfil());
        if (dados.getAtivo() != null)
            usuario.setAtivo(dados.getAtivo());
        // senha em branco = mantém a senha atual
        if (dados.getSenha() != null && !dados.getSenha().isBlank())
            usuario.setSenha(Md5Util.hash(dados.getSenha()));
        return repository.save(usuario);
    }

    public Usuario desativar(Integer id) {
        Usuario usuario = buscar(id);
        garantirOutroAdmin(usuario);
        usuario.setAtivo(false);
        return repository.save(usuario);
    }

    public Usuario ativar(Integer id) {
        Usuario usuario = buscar(id);
        usuario.setAtivo(true);
        return repository.save(usuario);
    }
}
