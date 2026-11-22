param(
    [string]$DbHost = 'localhost',
    [int]$DbPort = 5432,
    [string]$DbName = 'climacep',
    [string]$DbUser = 'postgres',
    [string]$DbUrl = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root 'backend\.env.local'
if (Test-Path $dest) {
    Write-Host 'A configuracao backend\.env.local ja existe e NAO sera sobrescrita.' -ForegroundColor Yellow
    Write-Host 'Edite o arquivo se precisar mudar sua senha ou IP.'
    exit 0
}
Write-Host 'ClimaCEP - configuracao local (sem Docker)' -ForegroundColor Cyan
Write-Host 'Use a senha do usuario PostgreSQL que voce definiu ao instalar o PostgreSQL.'
$secure = Read-Host 'Senha do PostgreSQL (nao aparece na tela)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ([string]::IsNullOrWhiteSpace($password)) { throw 'Senha vazia nao permitida.' }
if ($password.Contains("`n") -or $password.Contains("`r")) { throw 'Senha nao pode conter quebra de linha.' }
$random = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($random) } finally { $rng.Dispose() }
$jwtSecret = [Convert]::ToBase64String($random)
$content = @(
  "DB_HOST=$DbHost"
  "DB_PORT=$DbPort"
  "DB_NAME=$DbName"
  "DB_USER=$DbUser"
  "DB_PASSWORD=$password"
  "APP_JWT_SECRET=$jwtSecret"
  'PORT=8080'
)
if (-not [string]::IsNullOrWhiteSpace($DbUrl)) {
  $content += "DB_URL=$DbUrl"
}
$content = $content -join "`r`n"
[System.IO.File]::WriteAllText($dest, $content + "`r`n", ([System.Text.UTF8Encoding]::new($false)))
Write-Host 'Configuracao criada com sucesso: backend\.env.local' -ForegroundColor Green
Write-Host 'ATENCAO: contem a senha em texto simples, apenas na maquina local. Nao envie ao GitHub.' -ForegroundColor Yellow
if (-not [string]::IsNullOrWhiteSpace($DbUrl)) {
  Write-Host 'O Flyway criara as tabelas em public no banco PostgreSQL do Supabase.'
} else {
  Write-Host 'O banco climacep deve existir no PostgreSQL local (crie no pgAdmin antes de iniciar).'
}
