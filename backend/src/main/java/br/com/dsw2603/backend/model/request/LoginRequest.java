package br.com.dsw2603.backend.model.request;

import lombok.Data;

@Data
public class LoginRequest {

    private String email;

    private String senha;
}
