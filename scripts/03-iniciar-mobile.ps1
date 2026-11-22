$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root 'mobile'
if (-not (Test-Path (Join-Path $mobile '.env'))) {
    throw 'Arquivo mobile\.env nao encontrado. Copie mobile\.env.example para mobile\.env e coloque o IPv4 do computador.'
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'Node.js/npm nao encontrados. Instale Node.js 22.13+.' }
Push-Location $mobile
try {
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'Instalando dependencias do mobile...' -ForegroundColor Cyan
        & npm install
        if ($LASTEXITCODE -ne 0) { throw 'npm install falhou.' }
    }
    Write-Host 'Iniciando Expo Go (SDK 58)...' -ForegroundColor Cyan
    & npx expo start -c
} finally { Pop-Location }
