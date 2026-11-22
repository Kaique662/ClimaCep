param([string]$Ip = 'localhost', [int]$Porta = 8080)
$ErrorActionPreference = 'Stop'
$url = "http://${Ip}:${Porta}/api/health"
Write-Host "Testando $url" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $url -TimeoutSec 8 -Method Get
    $response | ConvertTo-Json -Depth 5
    if ($response.status -ne 'ok') { throw 'A API respondeu, mas nao informou status ok.' }
    Write-Host 'API disponivel neste computador.' -ForegroundColor Green
} catch {
    Write-Host "Falha ao acessar a API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Verifique se o Spring Boot esta rodando, a porta e o IP.'
    exit 1
}
