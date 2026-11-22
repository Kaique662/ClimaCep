# ClimaCEP sem Docker — comece por aqui

**Voce precisa instalar:** PostgreSQL + pgAdmin, Java JDK 17/21, Maven 3.9+, Node.js 22.13+ e Expo Go.

1. No **pgAdmin**, crie o banco `climacep` (dono: `postgres`). Nao crie tabelas.
2. No terminal **PowerShell**, na **pasta principal** do projeto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\01-configurar-local.ps1
   ```

   Digite a senha que voce definiu durante a instalacao do PostgreSQL.

3. **Terminal 1 — Spring Boot:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
   ```

   Deixe esse terminal aberto. Confira `http://localhost:8080/api/health` no computador.

4. Em `mobile`, **copie** `.env.example` para `.env`. Coloque **o IP do computador** (ex.: `192.168.15.117`) em `EXPO_PUBLIC_API_URL`. O celular nao e o servidor.

5. Confira `http://IP_DO_COMPUTADOR:8080/api/health` no **navegador do celular**. Se nao abrir, verifique a rede privada e o firewall antes de testar cadastro.

6. **Terminal 2 — Expo:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
   ```

   Escaneie o QR Code pelo Expo Go e tente cadastrar.

**Guia completo, com solucoes de erros:** `docs/INSTALACAO_WINDOWS.md`.

**Atencao:** os dados de um banco antigo em outra instalacao nao passam automaticamente para o PostgreSQL local. Faça backup antes de desinstalar ou apagar o banco antigo.
