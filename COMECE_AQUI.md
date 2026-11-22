# ClimaCEP — comece por aqui

**Voce precisa instalar:** Java JDK 17/21, Maven 3.9+, Node.js 22.13+ e Expo Go. O banco PostgreSQL fica hospedado no Supabase.

1. No Explorer, copie `backend/.env.local.example` para `backend/.env.local`. Abra a copia, preencha os placeholders de conexao do projeto e substitua `DB_PASSWORD` e `APP_JWT_SECRET`. As configuracoes do backend ficam nesse arquivo; nao as defina no terminal. Nao compartilhe nem envie `.env.local` ao GitHub.
2. **Terminal 1 — Spring Boot**, na raiz do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
   ```

   Deixe esse terminal aberto. Flyway cria as tabelas no schema `public` do Supabase na primeira inicializacao. Confira `http://localhost:8080/api/health` no computador.

3. Em `mobile`, copie `.env.example` para `.env`. Coloque o IP do computador (ex.: `192.168.15.117`) em `EXPO_PUBLIC_API_URL`. Essa configuracao permite que o celular alcance a API; nao e configuracao do banco.

4. Confira `http://IP_DO_COMPUTADOR:8080/api/health` no navegador do celular. Se nao abrir, verifique a rede e o firewall antes de testar cadastro.

5. **Terminal 2 — Expo:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
   ```

   Escaneie o QR Code pelo Expo Go e tente cadastrar.

**Guia completo, com solucoes de erros:** `docs/INSTALACAO_WINDOWS.md`.

**Atencao:** os dados de um banco local antigo nao sao transferidos automaticamente para o Supabase. Faça backup e migre-os antes de deixar de usar a base antiga.
