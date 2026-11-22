# ClimaCEP v2.2 — projeto completo SEM Docker

**Aplicativo mobile de previsao climatica por CEP + relatos colaborativos de enchentes**  
**React Native / Expo SDK 58 · Spring Boot 3.5 / Java 17+ · PostgreSQL instalado no Windows**

Esta edicao mantem as telas do projeto v2.1.1, inclusive a correção do `FloodReportRepository`, mas remove por completo a necessidade de Docker ou WSL para executar o projeto. **Nao ha Dockerfile nem docker-compose no pacote.**

## Arquitetura

```text
CELULAR — Expo Go (React Native SDK 58)
  |-- APIs de CEP + Open-Meteo -> previsao por coordenadas do CEP
  |-- http://IPv4_DO_PC:8080/api/* (JWT)
                  |
COMPUTADOR — Spring Boot via Maven (Windows / Java)
                  |
        PostgreSQL local (Windows, porta 5432)
```

**7 telas:** Login, Cadastro, Inicio (clima), Enchentes, Favoritos (CRUD), Historico e Perfil.  
**JWT:** autenticacao no backend; senha BCrypt; token no SecureStore.  
**Banco relacional:** `users`, `favorites`, `search_history`, `flood_reports` via Flyway.  
**AsyncStorage:** ultimo CEP por usuario. **Estado:** AuthContext e hooks.

## Instalar — roteiro resumido

1. Instale **PostgreSQL 16/17 + pgAdmin**, **Java JDK 17/21**, **Maven 3.9+** e **Node.js 22.13+**. Verifique `java -version`, `mvn -version` e `node -v`.
2. Garanta que a porta `5432` esteja livre de servicos antigos; no pgAdmin, crie o banco **`climacep`**, owner `postgres`. Nao crie tabelas: Flyway faz isso automaticamente.
3. Na raiz do projeto, configure a senha do PostgreSQL e um JWT aleatorio:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\01-configurar-local.ps1
   ```

4. **Terminal 1 — Backend**, na raiz do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
   ```

5. Confira a API: `http://localhost:8080/api/health`. Resultado esperado: `{"status":"ok","application":"ClimaCEP API"}`.
6. Copie **`mobile/.env.example`** para **`mobile/.env`** e configure o **IPv4 do computador**, por exemplo `EXPO_PUBLIC_API_URL=http://192.168.15.117:8080`. Nao use IP do celular ou gateway.
7. Teste `http://IPv4_DO_PC:8080/api/health` **no navegador do celular**. Se nao abrir, confira firewall/rede antes de tentar cadastro.
8. **Terminal 2 — Mobile**, na raiz do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
   ```

   Abra o QR Code com o Expo Go. Na primeira execucao o script instala as dependencias via `npm install`.

## Guias e arquivos

| Arquivo | Conteudo |
|---|---|
| `docs/INSTALACAO_WINDOWS.md` | **Passo a passo completo** sem Docker e resolucao de problemas |
| `scripts/01-configurar-local.ps1` | Salva credenciais locais e gera segredo JWT |
| `scripts/02-iniciar-backend.ps1` | Carrega credenciais e inicia Maven/Spring Boot |
| `scripts/03-iniciar-mobile.ps1` | Prepara e inicia Expo Go |
| `scripts/04-testar-api.ps1` | Testa `/api/health` no Windows |
| `database/01-criar-banco.sql` | Opcional para criar banco pelo pgAdmin Query Tool |
| `docs/ARQUITETURA.md` | Camadas, entidades e fluxos do sistema |
| `docs/EXEMPLOS_API.md` | Requisicoes para Postman/Insomnia |
| `docs/CHECKLIST_ENTREGA.md` | Requisitos obrigatorios e testes manuais |

## Comandos manuais equivalentes

No backend, nao se usa `npm install`: **Java usa Maven**. Caso prefira usar comandos manuais em vez dos scripts, configure `DB_PASSWORD` e `APP_JWT_SECRET` como variaveis de ambiente no terminal e execute:

```powershell
cd backend
mvn spring-boot:run
```

No frontend:

```powershell
cd mobile
npm install
npx expo start -c
```

## Importante sobre dados existentes

Se suas contas, favoritos e relatos estavam gravados em um PostgreSQL antigo de outra instalacao, **eles nao migram automaticamente** para o PostgreSQL novo. Para reutiliza-los e necessario exportar o banco antigo e restaurar no novo. Nao remova o banco anterior antes de fazer backup.

## Limites e seguranca

Relatos de enchente sao colaborativos e **nao sao alertas oficiais**. O usuario pode registrar informacoes incorretas, por isso a tela nao confirma seguranca de uma rua. O clima e previsao de grade meteorologica associada as coordenadas do CEP, nao sensor instalado no bairro.

Esta configuracao usa HTTP apenas para desenvolvimento na rede privada. Para distribuir publicamente, habilite HTTPS, politicas de rede e segredo JWT seguro. `backend/.env.local` e `mobile/.env` sao ignorados pelo Git; **nao compartilhe credenciais**.

## Validacao

Os testes simulados de clima podem ser executados com `cd mobile; npm run test:weather`. Os testes backend estao em `backend/src/test` e podem ser executados com `cd backend; mvn test` quando Maven e dependencias estiverem instalados. **A integracao completa Expo Go + Java + PostgreSQL deve ser validada no computador do grupo.**
