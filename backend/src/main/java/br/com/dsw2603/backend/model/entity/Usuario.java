package br.com.dsw2603.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    // Integer (e não Long) porque a coluna id_usuario do script SQL é INT
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nome;

    // único (RN17)
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // o JSON recebe "senha", o banco guarda o hash MD5 em senha_hash e ela nunca volta na resposta (RN17)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senha;

    // ADMINISTRADOR ou OPERADOR
    @Column(nullable = false, length = 20)
    private String perfil;

    // usuário inativo não consegue entrar (RN17)
    @Column(nullable = false)
    private Boolean ativo = true;
}
