# Arquitetura do ClimaCEP — Visão para apresentação

## Objetivo

Permitir que cada usuário autenticado pesquise o clima **da região associada ao CEP**, registre suas consultas e mantenha uma lista de regiões favoritas. O foco é entregar uma solução mobile com dados meteorológicos externos e um backend próprio para dados de negócio.

## Fluxo

```text
                 CELULAR / EXPO GO (React Native)
                Login / Cadastro / Início / Favoritos
                           Histórico / Perfil
                                 |
               +-----------------+-------------------+
               |                                     |
      Consulta meteorológica              API REST /api/* + JWT
               |                                     |
     BrasilAPI + AwesomeAPI                       Spring Boot
         (CEP -> latitude/longitude)                 |
               |                         Spring Security (JWT/BCrypt)
           Open-Meteo                                |
    (previsão da grade mais próxima)          Spring Data JPA
               |                                     |
       cards por hora e semana                    PostgreSQL
                                       (users/favorites/search_history)
```

## Separação de responsabilidades

**Mobile (React Native / Expo SDK 58)**: renderiza as sete telas, trata interação, navegação via React Navigation, gerencia estado via AuthContext e hooks, salva o último CEP no AsyncStorage e guarda token JWT no SecureStore. Faz `fetch()` para os serviços meteorológicos e requisições REST com Bearer para Spring Boot.

**Backend (Spring Boot 3.5 / Java 17)**: cria contas, autentica, emite JWT assinado, valida JWT nas rotas privadas, controla favoritos do próprio usuário, atualiza perfil e persiste histórico.

**PostgreSQL**: guarda dados relacionais versionados por migrações Flyway.

**APIs externas**: BrasilAPI e AwesomeAPI informam a localização associada ao CEP; Open-Meteo fornece a previsão na célula meteorológica mais próxima da coordenada selecionada.

## Entidades relacionais

```text
users (1) --------< favorites (N)
    |
    +-------------< search_history (N)
```

- `users`: id, name, email (único), password_hash, created_at.
- `favorites`: id, user_id, cep, nickname, neighborhood, city, state, created_at; único por `(user_id, cep)`.
- `search_history`: id, user_id, cep, neighborhood, city, state, temperature, created_at.

## Regras de segurança

- Todas as rotas, exceto saúde/login/cadastro, exigem JWT válido.
- Senhas persistem somente como hash BCrypt, sem devolução na API.
- Favoritos e histórico são sempre consultados e modificados **pelo id extraído do JWT**. ID de outro usuário não autoriza o acesso.
- AsyncStorage **não** armazena token nem senha. A sessão utiliza Expo SecureStore.
- Endpoint público de saúde ajuda a conferir acesso pela rede local antes de testar no Expo Go.

## Riscos e limitações

- Dados meteorológicos são uma **estimativa de modelo** e não uma medição da rua.
- Coordenadas de provedores de CEP podem estar ausentes ou aproximadas. O aplicativo evita fallback silencioso para a cidade.
- Internet e disponibilidade dos provedores externos são necessários para uma nova previsão.
- A configuração HTTP, senha PostgreSQL e segredo JWT configurados no ambiente local estão dimensionadas para **demonstração local**. Implantação pública exige HTTPS, segredos exclusivos, políticas adequadas de CORS e monitoramento.
- A versão acadêmica não implementa tokens de atualização/revogação nem validação de e-mail.

## Demonstração recomendada

1. Mostrar `/api/health` no navegador.
2. Abrir Expo Go, cadastrar usuário, entrar.
3. Consultar dois CEPs distintos e explicar as coordenadas e a grade da Open-Meteo.
4. Salvar uma região; listar, renomear e excluir (CRUD completo).
5. Mostrar histórico e consulta anterior.
6. Editar perfil, sair e entrar novamente para demonstrar persistência relacional.
7. Tentar `GET /api/favorites` sem Bearer e demonstrar retorno 401.

## Relatos comunitários de alagamento — v2.1

**Nova tela React Native:** `mobile/src/screens/FloodScreen.js`, aba `Enchentes` e atalho na previsão por CEP.

**Backend:** `FloodReportController` (GET de relatos em janela de 24h; PUT idempotente por usuário/CEP; DELETE do próprio relato); `FloodReportRepository` + entidade `FloodReport` com status `FLOODED` ou `CLEAR`.

**Persistência:** tabela PostgreSQL `flood_reports`, criada por Flyway `V2__flood_reports.sql`, com FK para `users`, chave única `(user_id,cep)`, índices por CEP/horário e usuário.

**Segurança:** rotas autenticadas por JWT. Outros usuários não veem nome, e-mail ou ID de quem reportou. Um relato por usuário/CEP limita duplicação acidental, mas não impede informações falsas ou múltiplas contas.

**Interpretação:** relatos recentes por CEP são dados colaborativos, não alertas meteorológicos nem evidências oficiais de enchente. O status `CONFLICTING` identifica relatos contraditórios. O status `NO_REPORTS` não significa local seguro.
