# Build and push Portainer Docker image
# Usage: .\build-docker.ps1 [-Push] [-Tag "paterns/portainer:latest"]

param(
    [string]$Tag = "paterns/portainer:latest",
    [switch]$Push,
    [string]$Platform = "linux",
    [string]$Arch = "amd64"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=== Portainer Docker Build Script ===" -ForegroundColor Cyan
Write-Host "Tag: $Tag"
Write-Host "Platform: $Platform/$Arch"
Write-Host ""

# 1. Create dist directory
Write-Host "[1/6] Creating dist directory..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\dist")) {
    New-Item -ItemType Directory -Path "$ProjectRoot\dist" | Out-Null
}

# 2. Build Go binary for Linux
Write-Host "[2/6] Building Go binary for $Platform/$Arch..." -ForegroundColor Yellow
$env:GOOS = $Platform
$env:GOARCH = $Arch
$env:CGO_ENABLED = "0"

Push-Location "$ProjectRoot\api"
try {
    go build -trimpath --installsuffix cgo -o "..\dist\portainer" ./cmd/portainer/
    if ($LASTEXITCODE -ne 0) {
        throw "Go build failed"
    }
} finally {
    Pop-Location
}
Write-Host "  Binary built successfully" -ForegroundColor Green

# 3. Build client (frontend)
Write-Host "[3/6] Building client (webpack)..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $env:NODE_ENV = "production"
    pnpm exec webpack --config webpack/webpack.production.js
    if ($LASTEXITCODE -ne 0) {
        throw "Client build failed"
    }
} finally {
    Pop-Location
}
Write-Host "  Client built successfully" -ForegroundColor Green

# 4. Download dependencies (docker binary, etc.)
Write-Host "[4/6] Downloading binary dependencies..." -ForegroundColor Yellow
# Check if docker binary exists, if not download
if (-not (Test-Path "$ProjectRoot\dist\docker")) {
    Write-Host "  Downloading docker binaries (this may take a while)..." -ForegroundColor Yellow
    # Use WSL or skip if not available
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        wsl bash -c "cd '$($ProjectRoot -replace '\\','/' -replace 'C:','/mnt/c')' && ./build/download_binaries.sh linux amd64"
    } else {
        Write-Host "  WARNING: WSL not available, skipping binary download" -ForegroundColor Red
        Write-Host "  You may need to manually download docker binaries to dist/docker" -ForegroundColor Red
    }
}

# 5. Copy mustache templates
Write-Host "[5/6] Copying mustache templates..." -ForegroundColor Yellow
if (Test-Path "$ProjectRoot\mustache-templates") {
    if (Test-Path "$ProjectRoot\dist\mustache-templates") {
        Remove-Item -Recurse -Force "$ProjectRoot\dist\mustache-templates"
    }
    Copy-Item -Recurse "$ProjectRoot\mustache-templates" "$ProjectRoot\dist\mustache-templates"
}

# 6. Build Docker image
Write-Host "[6/6] Building Docker image..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    docker buildx build --load -t $Tag -f build/linux/Dockerfile .
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
} finally {
    Pop-Location
}
Write-Host "  Docker image built: $Tag" -ForegroundColor Green

# Push if requested
if ($Push) {
    Write-Host ""
    Write-Host "Pushing image to registry..." -ForegroundColor Yellow
    docker push $Tag
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed"
    }
    Write-Host "  Image pushed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Write-Host "Image: $Tag"
Write-Host ""
Write-Host "To run locally:"
Write-Host "  docker run -d -p 9000:9000 -p 9443:9443 -v portainer_data:/data $Tag"
Write-Host ""
if (-not $Push) {
    Write-Host "To push to registry:"
    Write-Host "  docker push $Tag"
    Write-Host "  or run: .\build-docker.ps1 -Push"
}
