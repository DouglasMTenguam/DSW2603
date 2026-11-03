# Deploy com Docker

Sobe MySQL, backend e frontend com um comando.

## Primeira vez

```bash
cd deploy
cp .env.example .env                                              # ajuste senhas e chave do JWT
cp docker-compose.override.example.yaml docker-compose.override.yaml   # opcional, só para rodar local
```

## Rodar

```bash
docker compose up -d --build
```

- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- MySQL (só com o override): `localhost:3307`, usuário `root`

## Arquivos

| Arquivo | Vai para o git? | Para quê |
|---|---|---|
| `docker-compose.yaml` | sim | definição dos serviços |
| `.env.example` | sim | modelo das variáveis |
| `.env` | não | senhas e portas de verdade |
| `docker-compose.override.example.yaml` | sim | modelo do override local |
| `docker-compose.override.yaml` | não | ajustes locais: expõe o MySQL na 3307 e liga o log de SQL; o Compose carrega sozinho |

## Comandos úteis

```bash
docker compose logs -f backend   # acompanhar os logs
docker compose down              # parar
docker compose down -v           # parar e apagar o banco
```

As portas 8080 e 4200 precisam estar livres: pare o backend do VS Code e o `ng serve` antes de subir.
