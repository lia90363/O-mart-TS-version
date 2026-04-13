import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 3000;

const localDbUrl = 'mysql://root:MySQL123!@localhost:3306/shopping_cart_db';

// 優先使用 Railway 提供給你的環境變數 MYSQL_URL，沒有的話才連本地
const dbUrl = process.env.MYSQL_URL || localDbUrl;

const pool = mysql.createPool(dbUrl);

// 測試連線是否成功 (這對 Debug 非常有幫助)
pool.getConnection()
  .then(conn => {
    console.log('--- 成功連線至資料庫 ---');
    conn.release();
  })
  .catch(err => {
    console.error('--- 資料庫連線失敗 ---');
    console.error('原因:', err.message);
  });

// [GET] 測試路徑
app.get('/', (req, res) => res.send('這是購物車後端首頁'));
app.get('/test', (req, res) => res.send('伺服器有通喔！'));

// [POST] 登入驗證
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 將 members 改為 users
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE email = ? AND password = ?", 
      [email, password]
    );

    if (rows.length > 0) {
      res.json({
        success: true,
        user: rows[0], // 回傳第一筆找到的使用者資料
        token: 'fake-jwt-token'
      });
    } else {
      res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: '伺服器登入出錯' });
  }
});

// [GET] 取得商品列表 (修正了 productsMap 未定義的問題)
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, v.id as variant_id, v.name as variant_name, v.image as variant_img
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
    `);

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

// [GET] 取得特定使用者的購物車 (整合為單一路由)
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
                await pool.query(
                    "UPDATE cart_items SET qty = ? WHERE id = ?",
                    [existing[0].qty + item.qty, existing[0].id]
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
    // 檢查帳號是否已存在
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '此帳號已被註冊' });
    }

    // 寫入新會員 (實務上密碼建議加密)
    const [result] = await pool.query(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, password, name]
    );

    res.json({ success: true, message: '註冊成功！', userId: result.insertId });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: '伺服器註冊出錯' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--- 伺服器啟動成功：http://localhost:${PORT} ---`);
});