# ClimaCEP — instalar e rodar no Windows

> **Tecnologias:** React Native / Expo SDK 58, Spring Boot 3.5 (Java 17+) e PostgreSQL hospedado no Supabase. Nao e necessario instalar PostgreSQL, pgAdmin, Docker ou WSL no computador.

## A. Instalar programas

1. Instale **JDK 17 ou 21** e verifique `java -version`.
2. Instale **Apache Maven 3.9+** e verifique `mvn -version`. Se nao for reconhecido, configure `MAVEN_HOME` e a pasta `bin` no `Path` do Windows; feche e reabra o VS Code.
3. Instale **Node.js 22.13+** e verifique `node -v` e `npm -v`.
4. Tenha o **Expo Go** compativel com o SDK 58 no celular.

## B. Configurar o backend e o banco Supabase

1. No Explorer, copie `backend/.env.local.example` e renomeie a copia para `backend/.env.local`.
2. Abra somente `backend/.env.local` no editor. Preencha os valores de conexao marcados como exemplo/placeholders para o projeto Supabase utilizado. Substitua `DB_PASSWORD` pela senha do banco e `APP_JWT_SECRET` por um segredo aleatorio com pelo menos 32 caracteres.
3. Salve o arquivo. Nao coloque credenciais no terminal, em arquivos versionados ou no aplicativo mobile. `backend/.env.local` e ignorado pelo Git; nao o envie a colegas nem ao GitHub.
4. Nao crie tabelas manualmente. O Spring Boot executa as migracoes Flyway e cria `users`, `favorites`, `search_history` e `flood_reports` no schema `public` na primeira inicializacao.

## C. Iniciar e testar o backend

Na raiz do projeto, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
```

O script carrega as configuracoes de `backend/.env.local` e inicia o Spring Boot. Na primeira execucao, Maven pode baixar dependencias. Mantenha esse terminal aberto.

Teste em outro terminal ou navegador no computador:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\04-testar-api.ps1
```

Ou abra `http://localhost:8080/api/health`. O resultado esperado e `{"status":"ok","application":"ClimaCEP API"}`.

## D. Conectar o Expo Go ao backend

O celular e o computador que executa o backend devem estar na mesma rede Wi-Fi.

1. No Windows, execute `ipconfig` e localize o IPv4 do adaptador em uso.
2. No Explorer, copie `mobile/.env.example` para `mobile/.env`. No arquivo, defina `EXPO_PUBLIC_API_URL` como `http://IP_DO_COMPUTADOR:8080`, usando o IPv4 encontrado.
3. No navegador do celular, abra `http://IP_DO_COMPUTADOR:8080/api/health`. So avance quando a API responder.
4. Na raiz do projeto, inicie o Expo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
```

Escaneie o QR Code com o Expo Go. Na primeira execucao o script instala as dependencias via `npm install`.

Se o endereco abrir no computador, mas nao no celular, confira a rede Wi-Fi, VPN e firewall. Em uma rede domestica confiavel marcada como Privada, permita acesso de entrada para a porta TCP 8080 somente na rede local. Nao desligue o firewall inteiro.

## E. Testes depois de iniciar

- Crie um usuario pela aba Cadastro e faca login.
- Consulte `04859240` e `04703003` na previsao.
- Salve, edite e exclua um favorito.
- Confirme que as consultas aparecem no historico.
- Envie um relato de enchente e confirme com uma segunda conta.
- No Supabase, confira os registros no schema `public`.

## F. Problemas comuns

| Erro | Causa possivel | Solucao |
|---|---|---|
| `mvn` nao e reconhecido | Maven nao instalado/no Path | Instale Maven, configure Path e reinicie VS Code |
| `password authentication failed` | Senha do banco incorreta | Corrija `DB_PASSWORD` em `backend/.env.local` e reinicie o backend |
| `Connection refused`, timeout ou erro DNS | URL, host, porta ou rede indisponivel | Confira os valores de conexao em `backend/.env.local` e o acesso a internet |
| Erro Flyway V1/V2 | Schema inconsistente ou migracao interrompida | Leia o log completo; nao apague tabelas ou dados automaticamente |
| `Address already in use: bind` | Porta 8080 ocupada | Pare o outro programa que utiliza a porta ou ajuste `PORT` em `backend/.env.local` |
| `fetch failed` no Expo Go | Celular nao alcanca o backend | Teste primeiro `/api/health` no navegador do celular |
| `401` em endpoint privado | Token JWT ausente ou expirado | Faca login novamente; `/api/health` e publico |

**Nao apague tabelas ou dados do Supabase para corrigir erro de rede.**
