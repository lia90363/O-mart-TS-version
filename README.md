# 🛒 O-mart模擬電商購物

[Vue 3]
[Pinia]
[Vercel]
[TypeScript]

### 🎯 專案介紹  
🛒 模擬電商完整流程（商品瀏覽 → 加入購物車 → 結帳）  
💡 專注於狀態管理與資料持久化，模擬實務開發情境

[🔗 立即試用 Demo](https://o-mart-ts-version.vercel.app/)
登入請使用：Test/1111

---

### 📸 專案預覽  
<img width="765" height="822" alt="image" src="https://github.com/user-attachments/assets/04e0c4bb-8944-448f-b1b0-aa82afc75d82" />

### 🛠 使用技術  
Vue 3：作為前端框架，使用 Composition API 開發  
TypeScript：強化類型定義，確保資料結構一致性，降低開發錯誤率  
Pinia：集中管理資料、收藏與歷史紀錄狀態  
Vue Router：處理頁面切換與路由邏輯  
Mock API：模擬後端資料來源，建立完整資料流  
RWD：確保各種裝置介面皆能保有最佳佈局
Debounce：優化搜尋體驗，避免頻繁請求  
LocalStorage（Persist）：保存購物車紀錄  
Vercel：部署專案  

### ✨ 功能亮點  
- 🔍 **商品瀏覽**  
- 🏷️ **商品款式選擇**  
- 🛒 **加入/移除購物車**  
- 🔐 **使用者登入/登出**  
- 💾 **購物車資料持久化**  
- 💳 **結帳流程**  

### 💡 核心學習  
◇實踐 TypeScript 重構，定義商品與購物車介面 (Interface)  
◇注重使用者體驗（UX），例如點擊首頁 Logo 返回頂部  
◇處理 LocalStorage（persist）與快取造成的資料不同步問題  
◇使用 Toast 提升提示體驗，取代傳統 alert  

### 📂 架構說明    
src/  
  ├─ api/          # 封裝 API 請求邏輯（Mock Data 獲取）  
  ├─ components/   # 可複用 UI 元件（如：Navbar, Footer, Card）  
  ├─ composables/  # 封裝組合式邏輯（如：Debounce, 視窗監聽）  
  ├─ plugins/      # 第三方套件設定（如：Pinia, Toast 插件）  
  ├─ router/       # 路由定義與導航守衛  
  ├─ stores/       # Pinia 狀態管理（Cart, User, Products）  
  ├─ styles/       # 全域 SCSS/CSS 樣式管理  
  └─ views/        # 各頁面進入點  
public/  
  └─ *.json        # 模擬後端資料源 (Mock Data)  
