# FeiraGestor — Frontend (Angular 19)

Substitui o conteúdo da pasta `frontend/` do repositório DSW2603.
Telas: login, dashboard, estoque e movimentações, compras e recebimento, perdas, produtos
(lista + formulário), fornecedores, relatórios e usuários.

## Como integrar ao repositório
1. Apague de `frontend/` o `index.html`, o `Dockerfile`, o `nginx.conf` e o `.dockerignore` antigos
   e copie TODO o conteúdo desta pasta para `frontend/`.
2. Nada muda no backend nem no `deploy/docker-compose.yaml` (o serviço `frontend` já faz `build: ../frontend`
   e publica a porta 4200).
3. `cd deploy && docker compose up -d --build` — o primeiro build baixa as dependências do npm.
4. Acesse `http://localhost:4200` e entre com o usuário do `database.sql` (o script cria `admin@gmail.com` / `admin123`).

## Rodar em desenvolvimento
```
npm install
npm start          # http://localhost:4200 — o proxy.conf.json envia /api e /auth para http://localhost:8080
```

## O que mudou no nginx
O backend responde em `/api/...` e `/auth/login`. O `nginx.conf` antigo usava `proxy_pass http://backend:8080/;`
(com barra), que removia o `/api` da URL. O novo repassa a URL intacta e inclui o prefixo `/auth/`.

## Perfis
* ADMINISTRADOR: tudo, incluindo cadastro de produtos/fornecedores/usuários e relatórios.
* OPERADOR ("Feirante / operador"): dashboard, estoque, compras, perdas e consulta de produtos/fornecedores.
  (O backend já bloqueia o resto com 403; o menu também esconde.)

## Observações
* Rode `npm install` uma vez e commite o `package-lock.json`; depois troque `npm install` por `npm ci` no Dockerfile.
* A tela de perdas mostra a data de hoje bloqueada, porque `PerdaRequest` não recebe data.
* "Confirmar recebimento" faz duas chamadas: `POST /api/compras` (cria PENDENTE) e `POST /api/compras/{id}/receber`.
