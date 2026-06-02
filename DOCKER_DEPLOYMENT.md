# Docker Deployment Guide

本指南說明如何使用 Docker 和 Docker Compose 部署 VPP Dashboard 應用程式。

## 前置需求

- Docker Engine 20.10+
- Docker Compose 2.0+
- PostgreSQL (主機或容器)
- 至少 2GB 可用記憶體

## 快速開始

### 1. 確認 PostgreSQL 可用

確保你的 PostgreSQL 資料庫正在運行並可從 Docker 容器訪問：

```bash
# 檢查 PostgreSQL 是否運行
psql -U postgres -c "SELECT version();"

# 確認資料庫存在
psql -U postgres -l | grep auth_db
```

### 2. 建置並啟動服務

```bash
# 建置 Docker image
docker-compose build

# 啟動容器
docker-compose up -d

# 查看日誌
docker-compose logs -f web
```

### 3. 同步資料庫 Schema

使用 Prisma `db push` 同步資料庫 schema（推薦用於開發環境）：

```bash
cd apps/web
DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db" npx prisma db push
```

> 📝 **注意**: 本專案使用 Prisma 7，由於 standalone 模式的限制，建議在主機上執行資料庫操作而非容器內。

### 4. 訪問應用程式

應用程式啟動後，在瀏覽器訪問：

- **Web 應用程式**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## ✅ 部署成功檢查清單

- [x] Docker 容器成功啟動（`docker-compose ps` 顯示 "Up"）
- [x] 應用程式正常回應（`curl http://localhost:3000` 返回 HTML）
- [x] 資料庫 schema 已同步（`npx prisma db push` 成功）
- [x] 無錯誤日誌（`docker-compose logs web` 顯示 "Ready"）

## 🛠️ 常用操作

### 查看日誌

```bash
# Web 應用程式日誌
docker-compose logs -f web

# PostgreSQL 日誌
docker-compose logs -f postgres

# 所有服務日誌
docker-compose logs -f
```

### 重啟服務

```bash
# 重啟 web 服務
docker-compose restart web

# 重啟所有服務
docker-compose restart
```

### 停止服務

```bash
# 停止所有服務（保留資料）
docker-compose stop

# 停止並移除容器（保留資料）
docker-compose down

# 停止並移除容器及資料卷（清除所有資料）
docker-compose down -v
```

### 重新建置

程式碼更新後需要重新建置：

```bash
# 重新建置並啟動
docker-compose up -d --build

# 僅重新建置（不啟動）
docker-compose build
```

### 進入容器 Shell

```bash
# 進入 web 容器
docker-compose exec web sh

# 進入 postgres 容器
docker-compose exec postgres sh
```

### 資料庫操作

```bash
# 執行 Prisma Studio（需要先安裝 prisma）
docker-compose exec web sh -c "cd apps/web && npx prisma studio"

# 執行資料庫遷移
docker-compose exec web sh -c "cd apps/web && npx prisma migrate deploy"

# 重設資料庫（開發環境）
docker-compose exec web sh -c "cd apps/web && npx prisma migrate reset"

# 使用 psql 連線到資料庫
docker-compose exec postgres psql -U vpp_user -d vpp_db
```

## 📦 Docker 架構說明

### 服務組成

```
┌─────────────────┐
│   Web (Next.js) │ :3000
│   Standalone    │
└────────┬────────┘
         │
         │ PostgreSQL Connection
         │
┌────────▼────────┐
│   PostgreSQL    │ :5432
│   Database      │
└─────────────────┘
```

### Multi-Stage Build

Dockerfile 使用三階段建構：

1. **deps**: 安裝相依套件
2. **builder**: 建置應用程式（Turbo + Next.js standalone）
3. **runner**: 執行環境（最小化映像）

### 資料持久化

- PostgreSQL 資料儲存在 Docker volume `postgres_data`
- 資料在容器重啟後保留
- 使用 `docker-compose down -v` 才會刪除

## 🔧 自訂配置

### 修改連接埠

編輯 `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "8080:3000" # 改為 8080
  postgres:
    ports:
      - "5433:5432" # 改為 5433
```

### 增加環境變數

編輯 `docker-compose.yml` 的 `web.environment` 區段：

```yaml
services:
  web:
    environment:
      # 新增自訂變數
      MY_CUSTOM_VAR: "value"
```

### 使用外部資料庫

如果想使用外部 PostgreSQL（而非 Docker Compose 的 postgres 服務）：

1. 移除 `docker-compose.yml` 中的 `postgres` 服務
2. 修改 `web.environment.DATABASE_URL` 指向外部資料庫
3. 移除 `depends_on: postgres`

## 🚨 故障排除

### 問題: 容器無法啟動

```bash
# 查看詳細錯誤訊息
docker-compose logs web

# 檢查容器狀態
docker-compose ps

# 重新建置
docker-compose up -d --build --force-recreate
```

### 問題: 資料庫連線失敗

```bash
# 檢查 PostgreSQL 健康狀態
docker-compose exec postgres pg_isready -U vpp_user

# 檢查網路
docker network ls
docker network inspect vpp_vpp-network
```

### 問題: Prisma migrations 失敗

```bash
# 手動執行 migrations
docker-compose exec web sh -c "cd apps/web && npx prisma migrate deploy"

# 查看 migration 狀態
docker-compose exec web sh -c "cd apps/web && npx prisma migrate status"
```

### 問題: 記憶體不足

調整 Docker Desktop 記憶體限制（推薦至少 4GB）或在 `docker-compose.yml` 中限制服務記憶體：

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
```

### 問題: 建置速度慢

```bash
# 使用本地快取
docker-compose build --no-cache

# 清理 Docker 系統
docker system prune -a
```

## 📊 效能優化

### 建議的生產環境設定

1. **使用環境變數檔案**：建立 `.env.production`
2. **啟用健康檢查**：監控服務狀態
3. **設定資源限制**：避免資源耗盡
4. **使用 Docker secrets**：管理敏感資訊
5. **設定重啟策略**：`restart: unless-stopped`

### 監控建議

- 使用 Docker stats 查看資源使用：`docker stats`
- 設定日誌輪替：避免磁碟空間耗盡
- 考慮使用 Docker Compose profiles 區分開發/生產環境

## 🔐 安全最佳實踐

1. ✅ 絕不將 `.env` 檔案提交到版本控制
2. ✅ 使用強隨機密鑰（JWT_SECRET）
3. ✅ 定期更新 Docker 基礎映像
4. ✅ 使用非 root 用戶執行應用程式（已實作）
5. ✅ 限制容器資源使用
6. ✅ 定期備份資料庫

## ⚠️ 重要注意事項

### NEXT*PUBLIC* 環境變數

Next.js 的 `NEXT_PUBLIC_*` 環境變數在**建置時**被硬編碼到 bundle 中：

- ✅ 已在 [Dockerfile](apps/web/Dockerfile) 中配置 `NEXT_PUBLIC_API_BASE_URL`
- ⚠️ 修改這些變數後**必須重新建置** Docker image
- ❌ 無法在 `docker-compose.yml` 中動態修改（會被忽略）

**如何修改 NEXT*PUBLIC* 變數：**

1. 編輯 `apps/web/Dockerfile`：

   ```dockerfile
   ENV NEXT_PUBLIC_API_BASE_URL="你的新 URL"
   ```

2. 重新建置：
   ```bash
   docker-compose build --no-cache web
   docker-compose up -d
   ```

### Prisma 7 資料庫管理

由於 Next.js standalone 模式的限制：

- ✅ **推薦**: 在主機上執行 `npx prisma db push`
- ❌ **不推薦**: 在容器內執行 `prisma migrate deploy`（會失敗）
- 📝 首次部署後手動同步一次即可，後續資料庫自動連接

### PostgreSQL 連接配置

- ✅ 使用 `host.docker.internal` 連接主機 PostgreSQL
- ✅ 已在 `docker-compose.yml` 中配置 `extra_hosts`
- ⚠️ 確保 PostgreSQL 允許從 Docker 容器連接（見前文配置）

## 📝 相關文件

- [主要 README](README.md) - 專案概覽
- [CLAUDE.md](CLAUDE.md) - 開發指南
- [文件中心](apps/web/docs/README.md) - 技術文件

## 🆘 需要協助？

- 查看 [Next.js 官方文件](https://nextjs.org/docs)
- 查看 [Docker Compose 文件](https://docs.docker.com/compose/)
- 查看 [Prisma 文件](https://www.prisma.io/docs)

---

**最後更新**: 2026-03-12
