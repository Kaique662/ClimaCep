$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$config = Join-Path $root 'backend\.env.local'
if (-not (Test-Path $config)) {
    throw 'Arquivo backend\.env.local nao encontrado. Execute scripts\01-configurar-local.ps1 primeiro.'
}
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java nao encontrado. Instale o JDK 17+ e configure o PATH.' }
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) { throw 'Maven nao encontrado. Instale o Maven 3.9+ e configure o PATH.' }
$keys = @('DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','APP_JWT_SECRET','PORT')
foreach ($line in [System.IO.File]::ReadAllLines($config)) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $parts = $trimmed.Split('=', 2)
    if ($parts.Length -ne 2) { throw "Linha de configuracao invalida: $trimmed" }
    $name = $parts[0].Trim()
    if ($name -notin $keys) { throw "Variavel desconhecida em .env.local: $name" }
    [Environment]::SetEnvironmentVariable($name, $parts[1], 'Process')
}
if (-not $env:DB_PASSWORD -or $env:DB_PASSWORD -eq 'COLOQUE_A_SENHA_DO_POSTGRES') { throw 'Configure DB_PASSWORD em backend\.env.local.' }
if (-not $env:APP_JWT_SECRET -or $env:APP_JWT_SECRET.Length -lt 32) { throw 'Configure APP_JWT_SECRET com 32 caracteres ou mais.' }
Write-Host 'Iniciando Spring Boot diretamente no Windows (porta 8080)...' -ForegroundColor Cyan
Write-Host 'O banco PostgreSQL deve estar iniciado no Windows. Pare com Ctrl+C.'
Push-Location (Join-Path $root 'backend')
try {
    & mvn spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw "Maven encerrou com codigo $LASTEXITCODE. Verifique a conexao com PostgreSQL e os logs acima." }
} finally { Pop-Location }
