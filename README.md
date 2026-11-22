# ClimaCEP v2.2 — projeto completo SEM Docker

**Aplicativo mobile de previsao climatica por CEP + relatos colaborativos de enchentes**  
**React Native / Expo SDK 58 · Spring Boot 3.5 / Java 17+ · PostgreSQL hospedado no Supabase**

## Arquitetura

```text
CELULAR — Expo Go (React Native SDK 58)
  |-- APIs de CEP + Open-Meteo -> previsao por coordenadas do CEP
  |-- http://IPv4_DO_PC:8080/api/* (JWT)
                  |
COMPUTADOR — Spring Boot via Maven (Windows / Java)
                  |
        PostgreSQL hospedado no Supabase
```

**7 telas:** Login, Cadastro, Inicio (clima), Enchentes, Favoritos (CRUD), Historico e Perfil.  
**JWT:** autenticacao no backend; senha BCrypt; token no SecureStore.  
**Banco relacional:** `users`, `favorites`, `search_history`, `flood_reports` via Flyway.  
**AsyncStorage:** ultimo CEP por usuario. **Estado:** AuthContext e hooks.

## Instalar — roteiro resumido

1. Instale **Java JDK 17/21**, **Maven 3.9+** e **Node.js 22.13+**. Verifique `java -version`, `mvn -version` e `node -v`. Nao e necessario instalar PostgreSQL nem pgAdmin no computador.
2. Copie `backend/.env.local.example` para `backend/.env.local`. No arquivo copiado, preencha os valores de conexao correspondentes ao projeto Supabase e substitua `DB_PASSWORD` pela senha do banco e `APP_JWT_SECRET` por um segredo aleatorio com pelo menos 32 caracteres.
3. **Terminal 1 — Backend**, na raiz do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
   ```

4. Confira a API: `http://localhost:8080/api/health`. Resultado esperado: `{"status":"ok","application":"ClimaCEP API"}`. Na primeira inicializacao, Flyway cria as tabelas no schema `public` do Supabase.
5. Copie `mobile/.env.example` para `mobile/.env` e configure o IPv4 do computador em `EXPO_PUBLIC_API_URL`, por exemplo `http://192.168.15.117:8080`. Nao use o IP do celular ou o gateway.
6. Teste `http://IPv4_DO_PC:8080/api/health` no navegador do celular. Se nao abrir, confira firewall e rede antes de tentar cadastro.
7. **Terminal 2 — Mobile**, na raiz do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
   ```

   Abra o QR Code com o Expo Go. Na primeira execucao o script instala as dependencias via `npm install`.

## Guias e arquivos

| Arquivo | Conteudo |
|---|---|
| `docs/INSTALACAO_WINDOWS.md` | **Passo a passo completo** sem Docker e resolucao de problemas |
| `backend/.env.local.example` | Modelo de configuracao do PostgreSQL Supabase e do JWT |
| `scripts/02-iniciar-backend.ps1` | Carrega `backend/.env.local` e inicia Maven/Spring Boot |
| `scripts/03-iniciar-mobile.ps1` | Prepara e inicia Expo Go |
| `scripts/04-testar-api.ps1` | Testa `/api/health` no Windows |
| `docs/ARQUITETURA.md` | Camadas, entidades e fluxos do sistema |
| `docs/EXEMPLOS_API.md` | Requisicoes para Postman/Insomnia |
| `docs/CHECKLIST_ENTREGA.md` | Requisitos obrigatorios e testes manuais |

## Comandos manuais equivalentes

No backend, nao se usa `npm install`: **Java usa Maven**. Para carregar as configuracoes de `backend/.env.local`, use o script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
```

No frontend:

```powershell
cd mobile
npm install
npx expo start -c
```

## Dados e seguranca

Os dados ficam no PostgreSQL do Supabase, independentemente do computador usado para executar o backend. Uma base local antiga nao e transferida automaticamente: exporte e migre os dados antes de deixar de usa-la.

## Limites e seguranca

Relatos de enchente sao colaborativos e **nao sao alertas oficiais**. O usuario pode registrar informacoes incorretas, por isso a tela nao confirma seguranca de uma rua. O clima e previsao de grade meteorologica associada as coordenadas do CEP, nao sensor instalado no bairro.

Esta configuracao usa HTTP apenas para desenvolvimento na rede privada. Para distribuir publicamente, habilite HTTPS, politicas de rede e segredo JWT seguro. `backend/.env.local` e `mobile/.env` sao ignorados pelo Git; **nao compartilhe credenciais**.

## Validacao

Os testes simulados de clima podem ser executados com `cd mobile; npm run test:weather`. Os testes backend estao em `backend/src/test` e podem ser executados com `cd backend; mvn test` quando Maven e dependencias estiverem instalados. **A integracao completa Expo Go + Java + Supabase deve ser validada no computador do grupo.**
