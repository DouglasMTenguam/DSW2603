package br.com.dsw2603.backend.util;

/** Valores de texto usados nas colunas perfil, tipo e status. */
public final class Constantes {

    private Constantes() {
    }

    // usuario.perfil
    public static final String ADMINISTRADOR = "ADMINISTRADOR";
    public static final String OPERADOR = "OPERADOR";

    // movimento_estoque.tipo
    public static final String ENTRADA = "ENTRADA";
    public static final String SAIDA = "SAIDA";
    public static final String PERDA = "PERDA";
    public static final String AJUSTE = "AJUSTE";

    // compra.status
    public static final String PENDENTE = "PENDENTE";
    public static final String RECEBIDA = "RECEBIDA";
}
