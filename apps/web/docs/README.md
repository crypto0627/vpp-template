# VPP Dashboard - 文檔中心

> 最後更新：2026-03-11

歡迎來到 VPP Dashboard 的完整技術文檔！本目錄包含所有專案架構、演算法、模組設計和測試結果的詳細說明。

---

## 📚 文檔目錄

### 🏗️ **專案架構**

#### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

**專案結構總覽** - 完整的專案架構指南

包含內容：

- 📁 完整目錄結構說明
- 🔑 核心模組詳解（BESS 模擬、電價算法、AI 聊天）
- 📊 數據流動圖
- 🧪 測試結構
- 🔐 認證流程
- 🛠️ 開發指南和命名慣例
- 🚀 快速開始指引

**適合對象：** 新加入的開發者、專案維護者、需要了解整體架構的人員

---

### 🤖 **AI 模組**

#### [AI_MODULE_STRUCTURE.md](AI_MODULE_STRUCTURE.md)

**AI 聊天助手模組化架構**

包含內容：

- 🎯 模組化重構目標和成果
- 📦 服務層架構（chat-service, ai-provider, usage-tracker）
- 🔄 API 路由簡化（186 行 → 91 行）
- 🌐 多語言支援實作
- 📈 Before/After 程式碼對比
- ✅ 測試和驗證

**適合對象：** 需要理解或擴展 AI 功能的開發者

---

### 📊 **演算法與計算**

#### [REPORT_ALGORITHM_SUMMARY.md](REPORT_ALGORITHM_SUMMARY.md)

**報告演算法摘要** - BESS 模擬和電費計算核心邏輯

包含內容：

- ⚡ BESS 跨日 SOC 持續性模擬
- 💰 電費計算算法（有/無儲能對比）
- 📈 尖離峰時段判定邏輯
- 🔋 充放電策略（工作日 00:00 充電、尖峰放電）
- 📅 週末和國定假日處理
- 🧮 數學公式和範例

**適合對象：** 需要理解或修改 BESS 模擬邏輯的開發者、演算法驗證人員

---

#### [PERIOD_SAVINGS_SETUP.md](PERIOD_SAVINGS_SETUP.md)

**月度和年度節費計算設定**

包含內容：

- 📅 月度/年度節費計算邏輯
- 📊 JSON 數據格式和來源
- 🔄 計算流程和 API 整合
- ⚙️ 設定和配置說明

**適合對象：** 需要實作或調整節費計算功能的開發者

---

### 🧪 **測試與品質保證**

#### [TEST-RESULTS.md](TEST-RESULTS.md)

**測試結果記錄** - 關鍵功能測試報告

包含內容：

- ✅ 測試執行結果和驗證
- 🐛 已知問題和解決方案
- 📝 測試場景和預期結果
- 🔍 偵錯和驗證方法

**適合對象：** QA 人員、需要驗證功能的開發者

---

## 🗂️ 文檔使用指南

### **我是新加入的開發者，應該先看哪些？**

建議閱讀順序：

1. 📖 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 了解整體架構
2. 📊 [REPORT_ALGORITHM_SUMMARY.md](REPORT_ALGORITHM_SUMMARY.md) - 理解核心演算法
3. 🤖 [AI_MODULE_STRUCTURE.md](AI_MODULE_STRUCTURE.md) - 了解 AI 功能（如果需要開發 AI 相關功能）

### **我要修改 BESS 模擬邏輯，應該看哪些？**

必讀文檔：

1. 📊 [REPORT_ALGORITHM_SUMMARY.md](REPORT_ALGORITHM_SUMMARY.md) - 理解現有演算法
2. 📖 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 查看核心模組說明
3. 🧪 [TEST-RESULTS.md](TEST-RESULTS.md) - 了解測試要求

⚠️ **重要提醒：** 修改 `utils/bess-unified.ts` 前務必運行完整測試套件！

### **我要新增功能，應該遵循什麼規範？**

參考文檔：

1. 📖 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 查看開發指南和命名慣例
2. 🤖 [AI_MODULE_STRUCTURE.md](AI_MODULE_STRUCTURE.md) - 參考服務層架構設計（如果是服務層功能）

---

## 🔗 相關文件

除了本目錄的技術文檔外，專案根目錄還有：

- [`CLAUDE.md`](../CLAUDE.md) - Claude Code 專案指引（給 AI 助手的指令）
- [`README.md`](../README.md) - 專案基本說明（如果存在）
- [`package.json`](../package.json) - 依賴和腳本配置

---

## 📝 文檔更新政策

- **何時更新：** 當有重大架構變更、新增核心功能、或修改關鍵演算法時
- **如何更新：** 直接編輯對應的 `.md` 檔案，並更新檔案頂部的「最後更新」日期
- **審查流程：** 文檔更新應隨程式碼一起提交 PR 並經過審查

---

## 💡 貢獻指南

如果你發現文檔有誤或需要補充：

1. 直接編輯對應的 `.md` 檔案
2. 更新「最後更新」日期
3. 在 commit message 中說明文檔變更
4. 如果是新增文檔，記得更新本 README.md 的目錄

---

**維護團隊：** Fortune ESS Development Team
**文檔版本：** v1.0
**最後檢查：** 2026-03-11
