#!/usr/bin/env bash
# SRFTI Grievance Redressal Portal — Deployment Script (Linux/Mac)
# Usage: ./deploy.sh [fresh|restart|stop|backup|restore|status]

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
ENV_FILE="$PROJECT_DIR/.env"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

header() {
    echo -e "\n${CYAN}========================================"
    echo -e "  $1"
    echo -e "========================================${NC}\n"
}

ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "  ${RED}✗ $1${NC}"; }

container_status() {
    for c in srfti_mysql_db srfti_backend_server srfti_frontend_client; do
        status=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo "NOT FOUND")
        health=$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null || echo "N/A")
        if [ "$status" = "running" ]; then
            echo -e "  $c : ${GREEN}$status${NC} (health: $health)"
        else
            echo -e "  $c : ${RED}$status${NC} (health: $health)"
        fi
    done
}

# --- Pre-flight checks ---
header "Pre-flight Checks"

# Check Docker
if ! command -v docker &>/dev/null; then
    err "Docker is not installed."
    echo "  Install from: https://docs.docker.com/get-docker/"
    exit 1
fi
ok "Docker installed"

# Check docker compose
if ! docker compose version &>/dev/null; then
    err "Docker Compose not available."
    exit 1
fi
ok "Docker Compose available"

# Check .env
if [ ! -f "$ENV_FILE" ]; then
    warn ".env not found. Creating from template..."
    cat > "$ENV_FILE" << 'ENVEOF'
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
ENVEOF
    warn "Created .env — edit it with your actual credentials."
else
    ok ".env file exists"
fi

# --- Actions ---
ACTION="${1:-fresh}"

case "$ACTION" in

    fresh)
        header "Fresh Deployment"

        echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
        docker compose down --remove-orphans 2>/dev/null || true

        echo -e "${YELLOW}Step 2: Removing old volumes...${NC}"
        for vol in $(docker volume ls -q | grep -i srfti); do
            docker volume rm "$vol" 2>/dev/null || true
            echo "  Removed: $vol"
        done

        echo -e "${YELLOW}Step 3: Building images...${NC}"
        docker compose build --no-cache

        echo -e "${YELLOW}Step 4: Starting services...${NC}"
        docker compose up -d

        echo -e "${YELLOW}Step 5: Waiting for initialization (15s)...${NC}"
        sleep 15

        echo -e "\n${YELLOW}Step 6: Service status:${NC}"
        container_status

        echo -e "\n${YELLOW}Step 7: Backend logs:${NC}"
        sleep 10
        docker logs srfti_backend_server --tail 20 || true

        echo -e "\n${GREEN}========================================"
        echo "  Deployment Complete!"
        echo -e "========================================${NC}"
        echo "  Frontend:  http://localhost:5173"
        echo "  Backend:   http://localhost:5000"
        echo "  API Test:  http://localhost:5000/api/settings"
        echo -e "${GREEN}========================================${NC}"

        # SMTP check
        if docker logs srfti_backend_server 2>&1 | grep -q "SMTP connection failed"; then
            warn "SMTP connection failed. Check .env credentials."
        fi
        if docker logs srfti_backend_server 2>&1 | grep -q "SMTP.*verified"; then
            ok "SMTP email service verified."
        fi
        ;;

    restart)
        header "Rebuilding and Restarting"

        echo -e "${YELLOW}Stopping...${NC}"
        docker compose down

        echo -e "${YELLOW}Building...${NC}"
        docker compose build

        echo -e "${YELLOW}Starting...${NC}"
        docker compose up -d

        sleep 15
        container_status

        echo -e "\n${GREEN}Services restarted. Access at http://localhost:5173${NC}"
        ;;

    stop)
        header "Stopping All Services"
        docker compose down
        ok "All containers stopped."
        ;;

    backup)
        header "Database Backup"

        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

        echo -e "${YELLOW}Creating: $BACKUP_FILE${NC}"
        docker exec srfti_mysql_db mysqldump -u root -psrfti_password srfti_grievance > "$BACKUP_FILE"

        if [ -f "$BACKUP_FILE" ]; then
            SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            ok "Backup complete ($SIZE)"
        else
            err "Backup failed!"
            exit 1
        fi

        # Backup uploads
        UPLOADS_DIR="$PROJECT_DIR/server/uploads"
        if [ -d "$UPLOADS_DIR" ]; then
            UPLOADS_ZIP="$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
            tar -czf "$UPLOADS_ZIP" -C "$PROJECT_DIR/server" uploads/
            ok "Uploads backed up to: $UPLOADS_ZIP"
        fi
        ;;

    restore)
        header "Database Restore"

        if [ ! -d "$BACKUP_DIR" ]; then
            err "No backups directory found."
            exit 1
        fi

        BACKUPS=($(ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null))
        if [ ${#BACKUPS[@]} -eq 0 ]; then
            err "No backup files found."
            exit 1
        fi

        echo -e "${YELLOW}Available backups:${NC}"
        for i in "${!BACKUPS[@]}"; do
            SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
            echo "  [$i] $(basename "${BACKUPS[$i]}") ($SIZE)"
        done

        read -rp $'\nEnter backup number to restore (0-$((${#BACKUPS[@]}-1))): ' CHOICE
        SELECTED="${BACKUPS[$CHOICE]}"

        echo -e "${YELLOW}Restoring from: $(basename "$SELECTED")${NC}"
        docker exec -i srfti_mysql_db mysql -u root -psrfti_password srfti_grievance < "$SELECTED"
        ok "Database restored."

        # Check for uploads backup
        UPLOADS_TAR="$BACKUP_DIR/uploads_$(basename "$SELECTED" | sed 's/backup_//;s/\.sql$/.tar.gz/')"
        if [ -f "$UPLOADS_TAR" ]; then
            read -rp "Uploads backup found. Restore? (y/n): " RESTORE_UP
            if [ "$RESTORE_UP" = "y" ]; then
                rm -rf "$PROJECT_DIR/server/uploads"
                tar -xzf "$UPLOADS_TAR" -C "$PROJECT_DIR/server/"
                ok "Uploads restored."
            fi
        fi
        ;;

    status)
        header "Service Status"
        container_status

        echo -e "\n${YELLOW}--- Backend Logs (last 15) ---${NC}"
        docker logs srfti_backend_server --tail 15 2>/dev/null || true

        echo -e "\n${YELLOW}--- Port Usage ---${NC}"
        for port in 3306 5000 5173; do
            if ss -tlnp 2>/dev/null | grep -q ":$port "; then
                echo -e "  Port $port : ${YELLOW}IN USE${NC}"
            else
                echo -e "  Port $port : ${GREEN}available${NC}"
            fi
        done
        ;;

    *)
        echo "Usage: $0 {fresh|restart|stop|backup|restore|status}"
        echo ""
        echo "  fresh   — Clean build and deploy (first-time setup)"
        echo "  restart — Rebuild images and restart containers"
        echo "  stop    — Stop all containers"
        echo "  backup  — Backup database + uploads to ./backups/"
        echo "  restore — Restore database from a backup"
        echo "  status  — Show container status, logs, and port usage"
        exit 1
        ;;
esac
