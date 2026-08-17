param(
  [string]$OutputDirectory = "release"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root 'manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$archiveName = "chapter-insights-$($manifest.version).zip"
$outputPath = Join-Path $root $OutputDirectory
$archivePath = Join-Path $outputPath $archiveName

New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
Push-Location $root
try {
  Compress-Archive -LiteralPath manifest.json,dist -DestinationPath $archivePath -Force
  $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath (Join-Path $outputPath 'SHA256SUMS.txt') -Value "$hash  $archiveName" -NoNewline
  Write-Output "已生成 $archivePath"
  Write-Output "SHA-256: $hash"
} finally {
  Pop-Location
}
