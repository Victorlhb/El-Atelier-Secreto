param(
  [string]$SourceRoot = "",
  [string]$OutputRoot = "",
  [string]$ConverterPath = "C:\Program Files\Calibre2\ebook-convert.exe",
  [string]$AuthorPattern = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Status {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Output "[$timestamp] $Message"
}

$letterEnye = [char]0x00F1
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $SourceRoot = "E:\Biblioteca Ebooks Espa${letterEnye}ol 2026 (epub)\biblioteca"
}

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = "E:\Biblioteca Ebooks Espa${letterEnye}ol 2026 (mobi)\biblioteca"
}

$resolvedSource = (Resolve-Path -LiteralPath $SourceRoot).Path

if (-not (Test-Path -LiteralPath $ConverterPath)) {
  throw "No se encontro ebook-convert en: $ConverterPath"
}

if (-not (Test-Path -LiteralPath $OutputRoot)) {
  New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
}

$files = Get-ChildItem -LiteralPath $resolvedSource -Recurse -Filter *.epub -File | Sort-Object FullName

if (-not [string]::IsNullOrWhiteSpace($AuthorPattern)) {
  $files = @(
    $files | Where-Object {
      $_.BaseName -match $AuthorPattern -or $_.DirectoryName -match $AuthorPattern
    }
  )
}

$total = @($files).Count

Write-Status "SOURCE=$resolvedSource"
Write-Status "OUTPUT=$OutputRoot"
if (-not [string]::IsNullOrWhiteSpace($AuthorPattern)) {
  Write-Status "AUTHOR_PATTERN=$AuthorPattern"
}
Write-Status "TOTAL_EPUB=$total"

$processed = 0
$converted = 0
$skipped = 0
$failed = 0

foreach ($file in $files) {
  $processed += 1
  $relativePath = $file.FullName.Substring($resolvedSource.Length).TrimStart('\', '/')
  $relativeMobi = [System.IO.Path]::ChangeExtension($relativePath, ".mobi")
  $destination = Join-Path $OutputRoot $relativeMobi
  $destinationDirectory = Split-Path -Path $destination -Parent

  if (-not (Test-Path -LiteralPath $destinationDirectory)) {
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  }

  if (Test-Path -LiteralPath $destination) {
    $skipped += 1
    if (($processed % 25) -eq 0) {
      Write-Status "PROGRESS=$processed/$total converted=$converted skipped=$skipped failed=$failed"
    }
    continue
  }

  try {
    & $ConverterPath $file.FullName $destination 1> $null 2> $null

    if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $destination)) {
      $converted += 1
    } else {
      $failed += 1
      Write-Status "FAIL file=$($file.FullName)"
    }
  } catch {
    $failed += 1
    Write-Status "EXCEPTION file=$($file.FullName) message=$($_.Exception.Message)"
  }

  if (($processed % 25) -eq 0) {
    Write-Status "PROGRESS=$processed/$total converted=$converted skipped=$skipped failed=$failed"
  }
}

Write-Status "DONE converted=$converted skipped=$skipped failed=$failed total=$total"
