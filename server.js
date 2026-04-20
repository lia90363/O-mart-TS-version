import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

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
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }, 
        token: 'fake-jwt-token'  // 目前先給予假 Token，之後可改用 JWT 簽發
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
        v.name as selectedVariantName, v.image
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON (c.product_id = v.product_id AND c.variant_index = v.id)
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
  const { email, password, name } = req.body;
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '此帳號已被註冊' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name] // 存入加密後的密碼
    );
    res.json({ success: true, message: '註冊成功！' });
  } catch (error) {
    res.status(500).json({ success: false, message: '註冊失敗' });
  }
});

// [POST] 結帳 API
app.post('/api/checkout', async (req, res) => {
  const { userId, shippingMethod, shippingDetail, couponCode } = req.body;

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
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;
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