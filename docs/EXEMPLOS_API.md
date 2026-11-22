# Exemplos de API REST (ClimaCEP)

Exemplos para **Postman**, **Insomnia** ou terminal. Base: `http://localhost:8080`.

## 1. Registrar usuário

```http
POST /api/auth/register
Content-Type: application/json

{"name":"Aluno Teste","email":"aluno@example.com","password":"Senha@2026"}
```

Resposta: `201 Created`, contendo `accessToken`, `tokenType: Bearer` e `user` (`id`, `name`, `email`).

## 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{"email":"aluno@example.com","password":"Senha@2026"}
```

Resposta: `200 OK` com JWT.

Para as rotas abaixo, no Postman, inclua:

```http
Authorization: Bearer SEU_TOKEN_AQUI
```

## 3. CRUD de favoritos

**CREATE**

```http
POST /api/favorites
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI

{"cep":"04703003","nickname":"Faculdade","neighborhood":"Santo Amaro","city":"São Paulo","state":"SP"}
```

**READ**

```http
GET /api/favorites
Authorization: Bearer SEU_TOKEN_AQUI
```

**UPDATE** (troque `1` pelo ID recebido no CREATE)

```http
PUT /api/favorites/1
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI

{"nickname":"Senac Santo Amaro","neighborhood":"Santo Amaro","city":"São Paulo","state":"SP"}
```

**DELETE**

```http
DELETE /api/favorites/1
Authorization: Bearer SEU_TOKEN_AQUI
```

## 4. Registrar pesquisa

```http
POST /api/history
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI

{"cep":"04703003","neighborhood":"Santo Amaro","city":"São Paulo","state":"SP","temperature":27.6}
```

Temperatura é **exemplo de payload**, não uma leitura meteorológica real.

## 5. Listar histórico

```http
GET /api/history
Authorization: Bearer SEU_TOKEN_AQUI
```

## 6. Editar perfil

```http
PUT /api/users/me
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI

{"name":"Aluno do Senac"}
```

## 7. Atualizar senha

```http
PUT /api/users/me/password
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI

{"currentPassword":"Senha@2026","newPassword":"NovaSenha@2026"}
```

## Respostas esperadas

- `200`: sucesso (consulta/atualização)
- `201`: cadastro concluído
- `204`: exclusão bem-sucedida, sem corpo
- `400`: dados inválidos
- `401`: token ausente/inválido, login incorreto
- `404`: registro não encontrado ou de outro usuário
- `409`: e-mail ou CEP favorito duplicado


## Relatos colaborativos de enchente (JWT)

```http
GET /api/flood-reports?cep=04859240
Authorization: Bearer SEU_JWT
```

```http
PUT /api/flood-reports/my/04859240
Authorization: Bearer SEU_JWT
Content-Type: application/json

{"status":"FLOODED","note":"Via com água acumulada","neighborhood":"Jardim Alvorada","city":"São Paulo","state":"SP"}
```

```http
DELETE /api/flood-reports/my/04859240
Authorization: Bearer SEU_JWT
```

Os relatos exibidos são das últimas 24 horas; `CLEAR` significa apenas que um usuário relatou ausência de alagamento, e não confirmação de segurança.
