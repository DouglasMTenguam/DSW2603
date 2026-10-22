package br.com.dsw2603.backend.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Intercepta as rotas protegidas, valida o JWT do header
 * "Authorization: Bearer <token>" e guarda o id e o perfil do usuário na requisição.
 * As rotas marcadas com @SomenteAdmin só passam para o administrador.
 */
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATRIBUTO_USUARIO_ID = "usuarioId";
    public static final String ATRIBUTO_PERFIL = "perfil";

    private final JwtUtil jwtUtil;

    public AuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token não informado");
        }
        Claims claims = jwtUtil.validarToken(header.substring(7));
        String perfil = claims.get("perfil", String.class);
        request.setAttribute(ATRIBUTO_USUARIO_ID, Integer.valueOf(claims.getSubject()));
        request.setAttribute(ATRIBUTO_PERFIL, perfil);

        if (handler instanceof HandlerMethod metodo && exigeAdmin(metodo)
                && !Constantes.ADMINISTRADOR.equals(perfil)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito ao administrador");
        }
        return true;
    }

    private boolean exigeAdmin(HandlerMethod metodo) {
        return metodo.hasMethodAnnotation(SomenteAdmin.class)
                || metodo.getBeanType().isAnnotationPresent(SomenteAdmin.class);
    }
}
