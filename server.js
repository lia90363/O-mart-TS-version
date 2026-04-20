import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // 這裡只有 smtp.gmail.com
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const saltRounds = 10; // 加密強度 (bcrypt 雜湊次數)
const app = express();

// 設定允許連線的前端來源 (包含 Vercel 雲端與本地端)
const allowedOrigins = [
  'https://o-mart-ts-version.vercel.app', 
  'http://localhost:5173', 
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // 允許沒有來源的請求 (例如 Postman) 或在白名單內的來源
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 政策不允許此來源連線'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());  // 解析 JSON 格式的請求主體
const PORT = process.env.PORT || 3000;

// 資料庫連線配置
const localDbUrl = 'mysql://root:MySQL123!@localhost:3306/shopping_cart_db';
// 優先使用 Railway 提供給環境變數 MYSQL_URL，否則使用本地連線
const dbUrl = process.env.MYSQL_URL || localDbUrl;
const pool = mysql.createPool(dbUrl); // 建立連線池提高效能

// 測試資料庫連線
pool.getConnection()
  .then(conn => {
    console.log(`--- 成功連線至資料庫：${conn.config.database} ---`);
    conn.release();
  })
  .catch(err => {
    console.error('--- 資料庫連線失敗 ---', err.message);
  });

const authenticateToken = (req, res, next) => {
  // 從 Header 的 Authorization 欄位取得 Token
  // 格式通常是: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '請先登入' });
  }

  // 驗證 Token 是否正確或過期
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '憑證無效或已過期' });
    }
    // 驗證成功，將解開的資料（如 userId）掛在 req 上，讓後面的程式碼可以用
    req.user = user;
    next(); // 准許過關，繼續執行下一個動作
  });
};

// [POST] 登入驗證
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password); // 安全比對加密密碼

    if (isMatch) {
      if (user.status === 0) {
        return res.status(403).json({ success: false, message: '請先至信箱完成驗證喔！' });
      }
      // 將 user id 包進 token 裡，並設定 24 小時後過期
      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }, 
        token: token
      });
    } else {
      res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
  } catch (error) {
    console.error('Login Error:', error); 
    res.status(500).json({ success: false, error: '伺服器錯誤' });
  }
});

// [GET] 取得商品列表
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, v.id as variant_id, v.name as variant_name, v.image as variant_img
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
    `);

    if (!rows || rows.length === 0) return res.json([]);

    // 將資料庫的一列一列資料整理成「一個商品包多個規格」的格式
    const products = rows.reduce((acc, row) => {
      const { id, title, price, description, category, variant_id, variant_name, variant_img } = row;
      if (!acc[id]) {
        acc[id] = { id, title, price, description, category, variants: [] };
      }
      if (variant_id) {
        acc[id].variants.push({ id: variant_id, name: variant_name, image: variant_img });
      }
      return acc;
    }, {});

    res.json(Object.values(products));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [GET] 取得特定使用者的購物車
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.product_id as id, c.qty, c.variant_index as selectedVariantIndex,
        p.title, p.price, p.category,
        v.name as selectedVariantName, v.image as image,
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON c.variant_index = v.id
      WHERE c.user_id = ?
    `, [userId]);

    // 統一格式：直接回傳陣列，或配合 cartStore.ts 修改
    res.json({ success: true, items: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [POST] 合併購物車
app.post('/api/cart/merge', async (req, res) => {
    const { userId, localItems } = req.body;
    if (!userId || !localItems) return res.status(400).json({ error: "參數缺失" });

    try {
        for (const item of localItems) {
            const [existing] = await pool.query(
                "SELECT id, qty FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_index = ?",
                [userId, item.id, item.selectedVariantIndex]
            );

            if (existing.length > 0) {
                // 記得加 [0]
                const newQty = existing[0].qty + item.qty; 
                await pool.query(
                    "UPDATE cart_items SET qty = ? WHERE id = ?",
                    [newQty, existing[0].id]
                );
            } else {
                await pool.query(
                    "INSERT INTO cart_items (user_id, product_id, variant_index, qty) VALUES (?, ?, ?, ?)",
                    [userId, item.id, item.selectedVariantIndex, item.qty]
                );
            }
        }
        res.json({ success: true, message: "購物車合併成功" });
    } catch (err) {
        res.status(500).json({ error: "伺服器合併失敗" });
    }
});

// [POST] 註冊新會員
app.post('/api/register', async (req, res) => {
  console.log('--- 收到註冊請求 ---');
  const { email, password, name } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  
  try {
    console.log('1. 檢查帳號中...');
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '此帳號已被註冊' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('2. 寫入資料庫中...');
    // 使用 pool.query 是最安全的，它會自動處理連線釋放
    await pool.query(
      "INSERT INTO users (email, password, name, verification_token, status) VALUES (?, ?, ?, ?, 0)",
      [email, hashedPassword, name, token]
    );
    console.log('3. 資料庫寫入成功！');

    // 💡 先發送回應，徹底中斷前端等待
    res.json({ success: true, message: '註冊成功！' });
    console.log('4. 已回傳 JSON 給前端');

    // --- 發信邏輯移到最後，完全不影響 res ---
    const verifyUrl = `http://localhost:3000/api/verify/${token}`;
    const mailOptions = { /* ... 你的內容 ... */ };
    
    console.log('5. 嘗試背景發信...');
    transporter.sendMail(mailOptions)
      .then(() => console.log(`✅ 信件已成功送達: ${email}`))
      .catch(err => console.error('❌ 背景發信失敗:', err.message));

  } catch (error) {
    console.error('❌ 註冊出錯:', error);
    if (!res.headersSent) res.status(500).json({ success: false });
  }
});

// 信箱驗證
app.get('/api/verify/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE verification_token = ?", [token]);
    
    if (rows.length === 0) return res.send('驗證連結無效');

    // 驗證成功：清空 token 並將 status 改為 1 (已驗證)
    await pool.query("UPDATE users SET status = 1, verification_token = NULL WHERE verification_token = ?", [token]);
    
    // 直接導向前端登入頁面
    res.redirect('http://localhost:5173/login?verified=true');
  } catch (error) {
    res.status(500).send('驗證過程發生錯誤');
  }
});

// [POST] 結帳 API
app.post('/api/checkout', authenticateToken, async (req, res) => {
  const userId = req.user.userId; 
  const { shippingMethod, shippingDetail, couponCode } = req.body;
  const connection = await pool.getConnection();

  try {
    // 重新從資料庫撈取商品確保價格正確
    const [dbCartItems] = await connection.query(`
      SELECT c.product_id, c.qty, p.price, v.name as variant_name
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON (c.product_id = v.product_id AND c.variant_index = v.id)
      WHERE c.user_id = ?
    `, [userId]);

    if (dbCartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `購物車為空，查無 userId 為 ${userId} 的商品`
      });
    }

    // 後端二度確認運費與折扣 (防止前端修改資料)
    const itemsPrice = dbCartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let shippingFee = 0;
    if (itemsPrice < 999) { // 免運門檻
      if (shippingMethod === 'home') shippingFee = 100;
      else if (shippingMethod === 'store') shippingFee = 60;
      else if (shippingMethod === 'pickup') shippingFee = 0;
    }
    let discount = 0;
    if (couponCode === 'Omart520') {
      discount = 100; // 統一由後端決定扣多少
    }
    const finalTotal = itemsPrice + shippingFee - discount;

    // 開始事務
    await connection.beginTransaction();

    // 寫入訂單主表
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
      (user_id, total_price, status, shipping_method, receiver_name, shipping_address, store_name, phone) 
      VALUES (?, ?, 'paid', ?, ?, ?, ?, ?)`,
      [
        userId, 
        finalTotal, 
        shippingMethod,
        shippingDetail?.receiver || '未填寫',
        shippingDetail?.address || '未填寫',
        shippingDetail?.storeName || '未填寫',
        shippingDetail?.phone || '未填寫'
      ]
    );
    const orderId = orderResult.insertId;

    // 寫入訂單明細
    for (const item of dbCartItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, variant_name, price_at_time, qty) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.variant_name || '標準款', item.price, item.qty]
      );
    }

    // 清空購物車
    await connection.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);

    await connection.commit();
    res.json({ success: true, orderId });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  } finally {
    connection.release();
  }
});

app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.product_id as id, c.qty, c.variant_index as selectedVariantIndex,
        p.title, p.price, p.category,
        v.name as selectedVariantName, v.image
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON (c.product_id = v.product_id AND c.variant_index = v.id)
      WHERE c.user_id = ?
    `, [userId]);

    // 確保回傳 success: true 且 items 欄位名稱與前端一致
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Fetch Cart Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [GET] 取得歷史訂單
app.get('/api/orders/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  // 安全檢查：防止 A 使用者輸入 B 的 ID 來看別人的訂單
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ success: false, message: '權限不足' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id AS order_id, o.total_price, o.created_at, o.status,
        o.shipping_method, o.receiver_name, o.shipping_address, o.store_name, o.phone,
        oi.product_id, oi.variant_name, oi.price_at_time, oi.qty,
        p.title, v.image
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants v ON (oi.product_id = v.product_id AND oi.variant_name = v.name)
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    const orders = rows.reduce((acc, row) => {
      const { 
        order_id, total_price, created_at, status, 
        shipping_method, receiver_name, shipping_address, store_name, phone,
        ...item 
      } = row;

      if (!acc[order_id]) {
        acc[order_id] = {
          order_id,
          total_price,
          created_at,
          status,
          shipping_info: {
            method: shipping_method,
            receiver: receiver_name,
            address: shipping_address,
            store: store_name,
            phone: phone
          },
          items: []
        };
      }
      acc[order_id].items.push(item);
      return acc;
    }, {});

    res.json({ success: true, orders: Object.values(orders) });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ success: false, message: '無法取得訂單資料' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--- 伺服器啟動成功：http://localhost:${PORT} ---`);
});