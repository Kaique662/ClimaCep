# ClimaCEP — instalar e rodar no Windows (sem Docker)

> **Tecnologias:** React Native / Expo SDK 58, Spring Boot 3.5 (Java 17+), PostgreSQL instalado no Windows. Nenhum container e necessario.

## A. Instalar programas

1. Instale **PostgreSQL 16 ou 17** com **pgAdmin 4**, anote a senha do usuario `postgres` e mantenha a porta `5432` (ou informe outra na configuracao).
2. Instale **JDK 17 ou 21** e verifique `java -version`.
3. Instale **Apache Maven 3.9+** e verifique `mvn -version`. Se nao for reconhecido, configure `MAVEN_HOME` e a pasta `bin` no `Path` do Windows; feche e reabra o VS Code.
4. Instale **Node.js 22.13+** e verifique `node -v` e `npm -v`.
5. Tenha o **Expo Go** compativel com o SDK 58 no celular.

**Atenção à porta 5432:** se houver algum servidor de banco antigo usando essa porta, encerre-o antes de iniciar o PostgreSQL instalado no Windows. Não exclua os dados antigos antes de fazer backup.

## B. Criar o banco (apenas na primeira vez)

1. Abra **pgAdmin 4**, conecte ao servidor PostgreSQL local usando a senha da instalacao.
2. Clique com o botao direito em **Databases > Create > Database...**.
3. Nome: `climacep`; Owner: `postgres` (padrao). Salve.
4. Nao crie tabelas manualmente. As migracoes Flyway `V1` e `V2` criarao `users`, `favorites`, `search_history` e `flood_reports` ao iniciar o Spring Boot.

Alternativa: conectado ao banco `postgres` no Query Tool, execute o SQL de `database/01-criar-banco.sql` **somente se o banco nao existir**.

Caso ja exista um PostgreSQL local com o banco `climacep`, reutilize-o. Um banco que estava em um container antigo **nao aparece automaticamente** neste PostgreSQL instalado no Windows; para preservar dados antigos e necessario backup/restauracao.

## C. Configurar senha e JWT (uma vez)

Abra PowerShell na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\01-configurar-local.ps1
```

Informe a senha do PostgreSQL quando solicitada. O script cria `backend/.env.local` (nao incluido no Git), contendo a senha e um segredo JWT aleatorio.

Se o usuario ou porta do PostgreSQL forem diferentes:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\01-configurar-local.ps1 -DbUser postgres -DbPort 5432
```

**Nunca envie `.env.local` a colegas ou ao GitHub**: ele contem a senha do banco em texto simples. O arquivo `.env.local.example` e apenas um modelo; o Spring Boot carrega as variaveis do arquivo local **por meio do script de inicializacao**.

## D. Iniciar backend Spring Boot

Abra um terminal PowerShell no VS Code (raiz do projeto):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\02-iniciar-backend.ps1
```

Na primeira vez o Maven baixa as dependencias. Mantenha o terminal aberto. O Spring Boot fica em `http://localhost:8080`.

Teste em outro terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\04-testar-api.ps1
```

Ou abra `http://localhost:8080/api/health` no navegador. O esperado e `{"status":"ok","application":"ClimaCEP API"}`.

**Comandos equivalentes sem os scripts** (temporarios, no terminal PowerShell que vai rodar o servidor):

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="climacep"
$env:DB_USER="postgres"
$env:DB_PASSWORD="SUA_SENHA_POSTGRES"
$env:APP_JWT_SECRET="USE_UM_SEGREDO_ALEATORIO_COM_NO_MINIMO_32_CARACTERES"
cd backend
mvn spring-boot:run
```

## E. Conectar o Expo Go ao backend

O telefone precisa do **IPv4 do COMPUTADOR** na rede Wi-Fi, nao do celular e nao do gateway.

1. No Windows, execute `ipconfig` e localize o endereco IPv4 do adaptador em uso.
2. Copie `mobile/.env.example` para `mobile/.env` e edite:

```env
EXPO_PUBLIC_API_URL=http://192.168.15.117:8080
```

Troque o IP pelo IPv4 real da sua maquina. **No celular** abra `http://SEU_IP:8080/api/health` no navegador. So avance quando essa URL responder. Computador e celular devem estar na mesma rede, sem isolamento de clientes.

3. No terminal PowerShell da raiz, execute:

```powershell
Copy-Item .\mobile\.env.example .\mobile\.env
# Edite mobile\.env antes de iniciar o Expo
powershell -ExecutionPolicy Bypass -File .\scripts\03-iniciar-mobile.ps1
```

Ou use os comandos manuais: `cd mobile`, `npm install` e `npx expo start -c`.

Se o navegador do **computador** abre `http://SEU_IP:8080/api/health`, mas o do **celular** nao abre, confira firewall/rede. **Somente em rede domestica confiavel configurada como Privada**, PowerShell como administrador:

```powershell
New-NetFirewallRule -DisplayName "ClimaCEP Java 8080" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080 -Profile Private -RemoteAddress LocalSubnet
```

Nao desligue o firewall inteiro. Se o Windows pedir para permitir acesso de Java/OpenJDK a redes privadas, autorize apenas sua rede confiavel. Se outro dispositivo ainda nao alcancar o servidor, confira VPN, dados moveis, Wi-Fi de convidados e isolamento de clientes no roteador.

## F. Testes depois de iniciar

- Crie um usuario pela aba Cadastro e faca login.
- Consulte `04859240` e `04703003` na previsao, observando o CEP e as coordenadas meteorologicas.
- Salve, edite e exclua um favorito (CRUD).
- Verifique se as consultas aparecem no historico.
- Envie um relato de enchente e confirme no segundo usuario.

## G. Problemas comuns

| Erro | Causa possivel | Solucao |
|---|---|---|
| `mvn` nao e reconhecido | Maven nao instalado/no Path | Instale Maven, configure Path e reinicie VS Code |
| `Connection refused` no PostgreSQL | Servico parado ou porta errada | Abra `services.msc`, inicie o servico `postgresql-x64-*`, confira porta 5432 |
| `database "climacep" does not exist` | Banco ainda nao criado | Crie o banco no pgAdmin |
| `password authentication failed` | Credencial errada | Edite `backend/.env.local`, reinicie Spring Boot |
| Erro Flyway V1/V2 | Banco/schemas inconsistentes | Leia log completo; nao apague dados automaticamente |
| `Address already in use: bind` | Porta 8080 ocupada | Pare o outro programa que utiliza a porta ou altere PORT e o .env |
| `fetch failed` no Expo Go | Celular nao alcanca backend | Teste primeiro `/api/health` no navegador do celular |
| `401` na rota `/` ou endpoint privado | JWT necessario | Teste `/api/health` ou faça login |

**Nao apague o banco ou suas tabelas para consertar erro de rede.**
