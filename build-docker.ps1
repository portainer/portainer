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

# 3. Install client dependencies
Write-Host "[3/7] Installing client dependencies (pnpm install)..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm install failed"
    }
} finally {
    Pop-Location
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# 4. Build client (frontend)
Write-Host "[4/7] Building client (webpack)..." -ForegroundColor Yellow
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

# 5. Download dependencies (docker binary, etc.)
Write-Host "[5/7] Downloading binary dependencies..." -ForegroundColor Yellow

# Read docker version from binary-version.json
$binaryVersionFile = "$ProjectRoot\binary-version.json"
$dockerVersion = (Get-Content $binaryVersionFile | ConvertFrom-Json).docker
# Remove 'v' prefix if present
$dockerVersion = $dockerVersion -replace '^v', ''

$downloadFolder = "$ProjectRoot\.tmp\download"
$dockerBinaryPath = "$ProjectRoot\dist\docker"

if (-not (Test-Path $dockerBinaryPath)) {
    Write-Host "  Downloading docker binary (v$dockerVersion)..." -ForegroundColor Yellow
    
    # Create download folder
    if (Test-Path $downloadFolder) {
        Remove-Item -Recurse -Force $downloadFolder
    }
    New-Item -ItemType Directory -Path $downloadFolder -Force | Out-Null
    
    # Map architecture
    $downloadArch = switch ($Arch) {
        "amd64" { "x86_64" }
        "arm64" { "aarch64" }
        "arm" { "armhf" }
        default { $Arch }
    }
    
    # Download docker binary for Linux
    $dockerUrl = "https://download.docker.com/linux/static/stable/$downloadArch/docker-$dockerVersion.tgz"
    $dockerTgz = "$downloadFolder\docker-binaries.tgz"
    
    Write-Host "  URL: $dockerUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerTgz -UseBasicParsing
    
    # Extract using tar (available in Windows 10+)
    tar -xf $dockerTgz -C $downloadFolder
    
    # Move docker binary to dist
    Move-Item "$downloadFolder\docker\docker" "$ProjectRoot\dist\docker"
    
    Write-Host "  Docker binary downloaded" -ForegroundColor Green
} else {
    Write-Host "  Docker binary already exists, skipping download" -ForegroundColor Green
}

# 6. Copy mustache templates
Write-Host "[6/7] Copying mustache templates..." -ForegroundColor Yellow
if (Test-Path "$ProjectRoot\mustache-templates") {
    if (Test-Path "$ProjectRoot\dist\mustache-templates") {
        Remove-Item -Recurse -Force "$ProjectRoot\dist\mustache-templates"
    }
    Copy-Item -Recurse "$ProjectRoot\mustache-templates" "$ProjectRoot\dist\mustache-templates"
}

# 7. Build Docker image
Write-Host "[7/7] Building Docker image..." -ForegroundColor Yellow
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
