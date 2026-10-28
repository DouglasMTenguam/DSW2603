DROP DATABASE IF EXISTS dsw2603_db;

CREATE DATABASE IF NOT EXISTS dsw2603_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dsw2603_db;

CREATE TABLE usuario (
  id_usuario  INT          NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,                 -- único (RN17)
  senha_hash  VARCHAR(255) NOT NULL,                 -- nunca a senha pura (RN17)
  perfil      VARCHAR(20)  NOT NULL,
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,    -- usuário inativo não entra (RN17)
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_email (email),
  CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('ADMINISTRADOR', 'OPERADOR'))
) ENGINE = InnoDB;

CREATE TABLE categoria (
  id_categoria INT         NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(80) NOT NULL,
  ativo        BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categoria_nome (nome)
) ENGINE = InnoDB;

CREATE TABLE fornecedor (
  id_fornecedor INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(120) NOT NULL,
  telefone      VARCHAR(20)  NOT NULL,
  contato       VARCHAR(100) NOT NULL,
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_fornecedor)
) ENGINE = InnoDB;

CREATE TABLE produto (
  id_produto       INT           NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(120)  NOT NULL,
  unidade_medida   VARCHAR(20)   NOT NULL,
  estoque_atual    DECIMAL(10,3) NOT NULL DEFAULT 0, -- nunca negativo (RN02, RN07)
  estoque_minimo   DECIMAL(10,3) NOT NULL DEFAULT 0, -- maior ou igual a zero (RN03)
  custo_referencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo            BOOLEAN       NOT NULL DEFAULT TRUE, -- desativado, nunca apagado (RN05)
  id_categoria     INT           NOT NULL,
  PRIMARY KEY (id_produto),
  KEY idx_produto_categoria (id_categoria),
  CONSTRAINT fk_produto_categoria
    FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria),
  CONSTRAINT ck_produto_unidade
    CHECK (unidade_medida IN ('kg', 'unidade', 'maço', 'caixa')),
  CONSTRAINT ck_produto_estoque_atual   CHECK (estoque_atual >= 0),
  CONSTRAINT ck_produto_estoque_minimo  CHECK (estoque_minimo >= 0),
  CONSTRAINT ck_produto_custo           CHECK (custo_referencia >= 0)
) ENGINE = InnoDB;
 
CREATE TABLE compra (
  id_compra     INT           NOT NULL AUTO_INCREMENT,
  data_compra   DATE          NOT NULL,
  valor_total   DECIMAL(12,2) NOT NULL DEFAULT 0,    -- soma dos subtotais (RN13)
  status        VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  id_fornecedor INT           NOT NULL,
  id_usuario    INT           NOT NULL,
  PRIMARY KEY (id_compra),
  KEY idx_compra_fornecedor (id_fornecedor),
  KEY idx_compra_usuario (id_usuario),
  KEY idx_compra_data (data_compra),
  CONSTRAINT fk_compra_fornecedor
    FOREIGN KEY (id_fornecedor) REFERENCES fornecedor (id_fornecedor),
  CONSTRAINT fk_compra_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT ck_compra_status CHECK (status IN ('PENDENTE', 'RECEBIDA')),
  CONSTRAINT ck_compra_total  CHECK (valor_total >= 0)
) ENGINE = InnoDB;
 
CREATE TABLE item_compra (
  id_item        INT           NOT NULL AUTO_INCREMENT,
  id_compra      INT           NOT NULL,
  id_produto     INT           NOT NULL,
  quantidade     DECIMAL(10,3) NOT NULL,             -- maior que zero (RN12)
  custo_unitario DECIMAL(10,2) NOT NULL,             -- maior que zero (RN12)
  subtotal       DECIMAL(12,2) NOT NULL,             -- quantidade x custo (RN13)
  PRIMARY KEY (id_item),
  KEY idx_item_compra (id_compra),
  KEY idx_item_produto (id_produto),
  CONSTRAINT fk_item_compra
    FOREIGN KEY (id_compra) REFERENCES compra (id_compra),
  CONSTRAINT fk_item_produto
    FOREIGN KEY (id_produto) REFERENCES produto (id_produto),
  CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
  CONSTRAINT ck_item_custo      CHECK (custo_unitario > 0),
  CONSTRAINT ck_item_subtotal   CHECK (subtotal >= 0)
) ENGINE = InnoDB;
 
CREATE TABLE movimento_estoque (
  id_movimento INT           NOT NULL AUTO_INCREMENT,
  id_produto   INT           NOT NULL,
  id_usuario   INT           NOT NULL,                -- responsável (RN08)
  id_compra    INT           NULL,
  tipo         VARCHAR(10)   NOT NULL,
  quantidade   DECIMAL(10,3) NOT NULL,                -- maior que zero (RN06)
  data_hora    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo       VARCHAR(255)  NULL,
  PRIMARY KEY (id_movimento),
  KEY idx_mov_produto (id_produto),
  KEY idx_mov_usuario (id_usuario),
  KEY idx_mov_compra (id_compra),
  KEY idx_mov_data_hora (data_hora),
  CONSTRAINT fk_mov_produto
    FOREIGN KEY (id_produto) REFERENCES produto (id_produto),
  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_mov_compra
    FOREIGN KEY (id_compra) REFERENCES compra (id_compra),
  CONSTRAINT ck_mov_tipo
    CHECK (tipo IN ('ENTRADA', 'SAIDA', 'PERDA', 'AJUSTE')),
  CONSTRAINT ck_mov_quantidade CHECK (quantidade > 0),
  -- toda perda exige motivo (RN10)
  CONSTRAINT ck_mov_motivo_perda
    CHECK (tipo <> 'PERDA' OR (motivo IS NOT NULL AND CHAR_LENGTH(TRIM(motivo)) > 0))
) ENGINE = InnoDB;

-- Primeiro administrador do sistema (rode uma vez, depois do script das tabelas).
-- Login: admin@feiragestor.com   Senha: admin123   (troque a senha depois de entrar)
-- O MD5() do MySQL gera o mesmo hash que o Md5Util do projeto.
USE dsw2603_db;
INSERT INTO usuario (nome, email, senha_hash, perfil, ativo)
VALUES ('Administrador', 'admin@gmail.com', MD5('admin123'), 'ADMINISTRADOR', TRUE);
