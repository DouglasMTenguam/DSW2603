package br.com.dsw2603.backend.util;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class JwtUtil {

    // a chave pode vir da variável de ambiente JWT_SECRET (mínimo 32 caracteres)
    private static final String SECRET = System.getenv().getOrDefault("JWT_SECRET",
            "feiragestor-chave-secreta-com-no-minimo-32-caracteres");
    private static final long EXPIRACAO_HORAS = 8;

    private final SecretKey chave = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public String gerarToken(Integer usuarioId, String email, String perfil) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuarioId))
                .claim("email", email)
                .claim("perfil", perfil)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(EXPIRACAO_HORAS, ChronoUnit.HOURS)))
                .signWith(chave)
                .compact();
    }

    /** Valida o token e devolve os dados dele. Devolve 401 se inválido/expirado. */
    public Claims validarToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(chave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token inválido ou expirado");
        }
    }
}
