# 🛒 O-mart模擬電商購物
- Frontend  
[Vue 3] [Pinia] [SCSS] [TypeScript]
  
- Backend  
[Node.js] [Express] [MySQL]
  
- Other  
[JWT] [bcrypt] [SendGrid]  
  
### 🎯 專案介紹  
🛒 一個具備完整購物流程的電商網站，包含會員系統、購物車、訂單與後端 API，採用前後端分離架構開發  
👉 本專案由前端延伸至全端開發，實作完整電商流程與後端系統設計

### 🚀 專案亮點  
🔐 使用 JWT + Middleware 實作完整身份驗證與授權流程  
🧾 建立完整電商流程（註冊 → 驗證 → 登入 → 購物車 → 訂單）  
💰 後端重新計算價格、運費與折扣，防止前端資料被竄改  
🔄 使用 MySQL Transaction 確保訂單資料一致性  
📧 整合 SendGrid，實作 Email 驗證與密碼重設流程  
🛡️ 實作 CORS 白名單機制，提升 API 安全性  
  
[🔗 立即試用 Demo](https://o-mart-ts-version.vercel.app/)

測試帳號：  
email: test123@example.com  
password: test123  
---

### 📸 專案預覽  
<img width="765" height="822" alt="image" src="https://github.com/user-attachments/assets/04e0c4bb-8944-448f-b1b0-aa82afc75d82" />

### 🛠 使用技術  
#### Frontend
- Vue 3：Composition API 開發  
- TypeScript：強化型別安全  
- Pinia：狀態管理  
- Vue Router：路由管理  

#### Backend
- Node.js + Express：建構 RESTful API，處理會員、購物車與訂單流程  
- MySQL：資料庫設計（users / products / orders / cart_items / order_items）  

#### Authentication & Security
- JWT：使用者身份驗證與授權機制  
- bcrypt：密碼加密處理，提升帳號安全性  

#### Integration
- SendGrid：實作 Email 驗證與密碼重設流程  

#### Others
- SCSS：樣式管理  
- LocalStorage：購物車持久化  
- Vercel：專案部署  


### ✨ 功能亮點  
⚙️ **前後端分離架構，透過 API 串接資料**  
🔍 **商品瀏覽、關鍵字搜尋**  
🏷️ **商品款式選擇**  
🛒 **加入/移除購物車**  
🔐 **會員系統(註冊、登入、忘記密碼)**  
💾 **購物車資料持久化**  
💳 **完整結帳與訂單系統(運費、折扣)**  
👤 **會員中心與權限管理**  


### 💡 核心學習  
◇實踐 TypeScript 重構，定義商品與購物車介面 (Interface)  
◇注重使用者體驗（UX），例如點擊首頁 Logo 返回頂部  
◇練習 computed 處理包含商品總計、運費、折扣、免運優惠的多重條件計算  
◇使用 Toast 提升提示體驗，取代傳統 alert  
◇結合 Pinia 與 LocalStorage，確保重整頁面後狀態不丟失，登出時清空敏感資訊  
◇利用 router.beforeEach 實作登入攔截機制，保護敏感頁面不外洩  


### 📡 API 範例  
POST /api/login  
GET /api/products  
POST /api/cart/merge  
POST /api/checkout  
GET /api/orders/:userId  


### 📂 架構說明    
Frontend (Vue + Pinia)  
        ↓ API  
Backend (Node.js + Express)  
        ↓  
Database (MySQL)  
  
src/  
  ├─ api/          # 封裝 API 請求邏輯（axios）  
  ├─ components/   # 可複用 UI 元件（SearchBar）  
  ├─ composables/  # 封裝組合式邏輯（Debounce、視窗監聽）  
  ├─ plugins/      # 第三方套件設定（Pinia、persist）  
  ├─ router/       # 路由定義與導航守衛  
  ├─ stores/       # Pinia 狀態管理（Cart, User, Products, Auths）  
  ├─ styles/       # 全域 SCSS 樣式管理  
  └─ views/        # 各頁面進入點  
  
MySQL/  
users (會員資料)  
products (商品)  
product_variants (商品規格)  
cart_items (購物車)  
orders (訂單主表)  
order_items (訂單明細)   
  
Update 2026.04.21  
✨ 新增：忘記密碼功能。  
🛠️ 優化：後端重新計算價格與運費，避免前端資料被竄改。  
