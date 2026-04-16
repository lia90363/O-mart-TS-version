# 🛒 O-mart模擬電商購物

[Vue 3]
[Pinia]
[Vercel]
[TypeScript]

### 🎯 專案介紹  
🛒 模擬電商完整流程（商品瀏覽 → 加入購物車 → 結帳）  
💡 專注於狀態管理與資料持久化，模擬實務開發情境

[🔗 立即試用 Demo](https://o-mart-ts-version.vercel.app/)

---

### 📸 專案預覽  
<img width="765" height="822" alt="image" src="https://github.com/user-attachments/assets/04e0c4bb-8944-448f-b1b0-aa82afc75d82" />

### 🛠 使用技術  
- Vue 3：作為前端框架，使用 Composition API 開發  
- TypeScript：強化類型定義，確保資料結構一致性，降低開發錯誤率  
- Pinia：集中管理資料、收藏與歷史紀錄狀態  
- Vue Router：處理頁面切換與路由邏輯  
- Mock API：模擬後端資料來源，建立完整資料流  
- RWD：確保各種裝置介面皆能保有最佳佈局  
- Debounce：優化搜尋體驗，避免頻繁請求  
- LocalStorage（Persist）：保存購物車紀錄  
- Vercel：部署專案  

### ✨ 功能亮點  
🔍 **商品瀏覽**  
🏷️ **商品款式選擇**  
🛒 **加入/移除購物車**  
🔐 **使用者登入/登出**  
💾 **購物車資料持久化**  
💳 **完整結帳與訂單系統**  
👤 **會員中心與權限管理**  

### 💡 核心學習  
◇實踐 TypeScript 重構，定義商品與購物車介面 (Interface)  
◇注重使用者體驗（UX），例如點擊首頁 Logo 返回頂部  
◇練習 computed 處理包含商品總計、運費、折扣、免運優惠的多重條件計算  
◇使用 Toast 提升提示體驗，取代傳統 alert  
◇結合 Pinia 與 LocalStorage，確保重整頁面後狀態不丟失，登出時清空敏感資訊  
◇利用 router.beforeEach 實作登入攔截機制，保護敏感頁面不外洩  


### 📂 架構說明    
src/  
  ├─ api/          # 封裝 API 請求邏輯（axios）  
  ├─ components/   # 可複用 UI 元件（SearchBar）  
  ├─ composables/  # 封裝組合式邏輯（Debounce、視窗監聽）  
  ├─ plugins/      # 第三方套件設定（Pinia、persist）  
  ├─ router/       # 路由定義與導航守衛  
  ├─ stores/       # Pinia 狀態管理（Cart, User, Products, Auths）  
  ├─ styles/       # 全域 SCSS 樣式管理  
  └─ views/        # 各頁面進入點  
public/  
  └─ *.json        # 模擬後端資料源 (會員、商品)  
  
Update 2026.04.16  
✨ 新增：完整訂單確認頁面與運費計算邏輯。  
🛠️ 優化：將運送選擇由下拉選單改為客製化 Radio 樣式，並連動動態表單。  
🐛 修復：解決免運門檻與運費重疊計算的邏輯錯誤。  