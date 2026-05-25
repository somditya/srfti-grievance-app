# SRFTI Grievance Redressal Portal — Deployment Script (Windows)
# Usage: .\deploy.ps1 [fresh|restart|stop|backup|restore|status]

param(
    [Parameter(Position=0)]
    [ValidateSet("fresh", "restart", "stop", "backup", "restore", "status")]
    [string]$Action = "fresh"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Join-Path $ProjectDir "backups"
$EnvFile = Join-Path $ProjectDir ".env"

# --- Helpers ---
function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Get-ContainerStatus() {
    $containers = @("srfti_mysql_db", "srfti_backend_server", "srfti_frontend_client")
    foreach ($c in $containers) {
        $status = docker inspect -f "{{.State.Status}}" $c 2>$null
        $health = docker inspect -f "{{.State.Health.Status}}" $c 2>$null
        if ($status) {
            $color = if ($status -eq "running") { "Green" } else { "Red" }
            Write-Host "  $c : $status (health: $health)" -ForegroundColor $color
        } else {
            Write-Host "  $c : NOT FOUND" -ForegroundColor Red
        }
    }
}

# --- Pre-flight checks ---
Write-Header "Pre-flight Checks"

# Check Docker
if (-not (Test-Command "docker")) {
    Write-Host "ERROR: Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
}
Write-Host "  Docker: OK" -ForegroundColor Green

# Check docker compose
try {
    docker compose version 2>$null | Out-Null
    Write-Host "  Docker Compose: OK" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker Compose not available." -ForegroundColor Red
    exit 1
}

# Check .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "  .env file not found. Creating from template..." -ForegroundColor Yellow
    @'
# Environmental Configuration for SRFTI Grievance Redressal Portal

# Backend Port
PORT=5000

# Database Configuration
DB_HOST=db
DB_USER=root
DB_PASSWORD=srfti_password
DB_NAME=srfti_grievance

# Secret keys — CHANGE THIS to a random string
JWT_SECRET=srfti_super_jwt_secret_key

# Node environment
NODE_ENV=development

# Google Workspace SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=agent@ailab.srfti.ac.in
SMTP_PASS=dirqswivrxvjyqjb

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173
'@ | Set-Content $EnvFile -Encoding UTF8
    Write-Host "  Created .env — please edit it with your actual credentials." -ForegroundColor Yellow
} else {
    Write-Host "  .env file: OK" -ForegroundColor Green
}

# --- Actions ---
switch ($Action) {

    "fresh" {
        Write-Header "Fresh Deployment"

        Write-Host "Step 1: Stopping any existing containers..." -ForegroundColor Yellow
        docker compose down --remove-orphans 2>$null

        Write-Host "Step 2: Removing old volumes (clean slate)..." -ForegroundColor Yellow
        $volumes = docker volume ls -q | Where-Object { $_ -match "srfti" }
        foreach ($vol in $volumes) {
            docker volume rm $vol 2>$null
            Write-Host "  Removed volume: $vol"
        }

        Write-Host "Step 3: Building images..." -ForegroundColor Yellow
        docker compose build --no-cache
        if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

        Write-Host "Step 4: Starting all services..." -ForegroundColor Yellow
        docker compose up -d

        Write-Host "Step 5: Waiting for services to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15

        Write-Host "`nStep 6: Checking service status..." -ForegroundColor Yellow
        Get-ContainerStatus

        Write-Host "`nStep 7: Checking backend logs..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        docker logs srfti_backend_server --tail 20

        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  Deployment Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
        Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
        Write-Host "  API Test:  http://localhost:5000/api/settings" -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Green

        # Check for backend errors
        $backendLogs = docker logs srfti_backend_server 2>&1
        if ($backendLogs -match "SMTP connection failed") {
            Write-Host "`nWARNING: SMTP connection failed. Check your .env SMTP credentials." -ForegroundColor Yellow
        }
        if ($backendLogs -match "Email.*verified") {
            Write-Host "SMTP: Email service verified and ready." -ForegroundColor Green
        }
    }

    "restart" {
        Write-Header "Rebuilding and Restarting"

        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker compose down

        Write-Host "Building images..." -ForegroundColor Yellow
        docker compose build

        Write-Host "Starting services..." -ForegroundColor Yellow
        docker compose up -d

        Start-Sleep -Seconds 15
        Get-ContainerStatus

        Write-Host "`nServices restarted. Access at http://localhost:5173" -ForegroundColor Green
    }

    "stop" {
        Write-Header "Stopping All Services"
        docker compose down
        Write-Host "All containers stopped." -ForegroundColor Green
    }

    "backup" {
        Write-Header "Database Backup"

        if (-not (Test-Path $BackupDir)) {
            New-Item -ItemType Directory -Path $BackupDir | Out-Null
        }

        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $backupFile = Join-Path $BackupDir "backup_$timestamp.sql"

        Write-Host "Creating backup: $backupFile" -ForegroundColor Yellow
        docker exec srfti_mysql_db mysqldump -u root -psrfti_password srfti_grievance > $backupFile

        if (Test-Path $backupFile) {
            $size = (Get-Item $backupFile).Length
            Write-Host "Backup complete ($size bytes)" -ForegroundColor Green

            # Also backup uploads
            $uploadsBackup = Join-Path $BackupDir "uploads_$timestamp.zip"
            $uploadsDir = Join-Path $ProjectDir "server\uploads"
            if (Test-Path $uploadsDir) {
                Compress-Archive -Path $uploadsDir -DestinationPath $uploadsBackup -Force
                Write-Host "Uploads backed up to: $uploadsBackup" -ForegroundColor Green
            }
        } else {
            Write-Host "Backup failed!" -ForegroundColor Red
        }
    }

    "restore" {
        Write-Header "Database Restore"

        if (-not (Test-Path $BackupDir)) {
            Write-Host "No backups directory found." -ForegroundColor Red
            exit 1
        }

        $backups = Get-ChildItem $BackupDir -Filter "backup_*.sql" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -eq 0) {
            Write-Host "No backup files found in $BackupDir" -ForegroundColor Red
            exit 1
        }

        Write-Host "Available backups:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $backups.Count; $i++) {
            $size = [math]::Round($backups[$i].Length / 1024, 1)
            Write-Host "  [$i] $($backups[$i].Name) ($size KB)"
        }

        $choice = Read-Host "`nEnter backup number to restore (0-$($backups.Count - 1))"
        $selected = $backups[[int]$choice]

        Write-Host "Restoring from: $($selected.Name)" -ForegroundColor Yellow
        Get-Content $selected.FullName | docker exec -i srfti_mysql_db mysql -u root -psrfti_password srfti_grievance

        Write-Host "Restore complete!" -ForegroundColor Green

        # Check if uploads backup exists
        $uploadsBackup = $selected.Name -replace "backup_", "uploads_" -replace "\.sql$", ".zip"
        $uploadsPath = Join-Path $BackupDir $uploadsBackup
        if (Test-Path $uploadsPath) {
            $restore = Read-Host "Uploads backup found. Restore it too? (y/n)"
            if ($restore -eq "y") {
                $uploadsDir = Join-Path $ProjectDir "server\uploads"
                if (Test-Path $uploadsDir) { Remove-Item $uploadsDir -Recurse -Force }
                Expand-Archive -Path $uploadsPath -DestinationPath (Join-Path $ProjectDir "server") -Force
                Write-Host "Uploads restored." -ForegroundColor Green
            }
        }
    }

    "status" {
        Write-Header "Service Status"
        Get-ContainerStatus

        Write-Host "`n--- Backend Logs (last 15 lines) ---" -ForegroundColor Yellow
        docker logs srfti_backend_server --tail 15

        Write-Host "`n--- Port Usage ---" -ForegroundColor Yellow
        $ports = @(3306, 5000, 5173)
        foreach ($port in $ports) {
            $listener = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($listener) {
                Write-Host "  Port $port : IN USE" -ForegroundColor Yellow
            } else {
                Write-Host "  Port $port : available" -ForegroundColor Green
            }
        }
    }
}
