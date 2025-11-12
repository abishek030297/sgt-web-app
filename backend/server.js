import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:4200',  // Your Angular app URL
  credentials: true
}));
app.use(express.json());

// XAMPP MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gold_assay_system',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to XAMPP MySQL database!');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. XAMPP is running');
    console.log('   2. MySQL service is started in XAMPP');
    console.log('   3. No password for root user');
  });

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Add this debug middleware BEFORE your routes
app.use((req, res, next) => {
  console.log('🌐 Incoming Request:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers['authorization'],
      'content-type': req.headers['content-type'],
      origin: req.headers['origin']
    },
    body: req.body
  });
  next();
});
// Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      message: 'Gold Assay System API is running',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );

    const token = jwt.sign(
      { userId: result.insertId, username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username, email, full_name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        full_name: user.full_name 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Customer Routes
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.execute(`
      SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.userId]);

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, id_type, id_number } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO customers (user_id, name, phone, email, address, id_type, id_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, name, phone, email, address, id_type, id_number]
    );

    res.status(201).json({ 
      message: 'Customer added successfully',
      customer: { 
        id: result.insertId, 
        name, 
        phone, 
        email, 
        address, 
        id_type, 
        id_number,
        user_id: req.user.userId
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, id_type, id_number } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const [result] = await pool.execute(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, id_type = ?, id_number = ?
       WHERE id = ? AND user_id = ?`,
      [name, phone, email, address, id_type, id_number, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      message: 'Customer updated successfully',
      customer: { 
        id: parseInt(req.params.id), 
        name, 
        phone, 
        email, 
        address, 
        id_type, 
        id_number 
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Assay Reports Routes
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.user_id = ? 
      ORDER BY ar.created_at DESC
    `, [req.user.userId]);

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name, c.phone, c.email 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ? AND ar.user_id = ?
    `, [req.params.id, req.user.userId]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { customer_id, metal_type, fineness, weight, serial_no, assay_date, notes } = req.body;
    
    if (!customer_id || !fineness || !weight || !serial_no || !assay_date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const [result] = await pool.execute(
      `INSERT INTO assay_reports (user_id, customer_id, metal_type, fineness, weight, serial_no, assay_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, customer_id, metal_type, fineness, weight, serial_no, assay_date, notes]
    );

    // Get the complete report with customer name
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      message: 'Assay report created successfully',
      report: reports[0]
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.put('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, metal_type, fineness, weight, serial_no, assay_date, notes } = req.body;
    
    if (!customer_id || !fineness || !weight || !serial_no || !assay_date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const [result] = await pool.execute(
      `UPDATE assay_reports 
       SET customer_id = ?, metal_type = ?, fineness = ?, weight = ?, serial_no = ?, assay_date = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [customer_id, metal_type, fineness, weight, serial_no, assay_date, notes, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get updated report
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ?
    `, [req.params.id]);

    res.json({ 
      message: 'Assay report updated successfully',
      report: reports[0]
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM assay_reports WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Dashboard Routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [reportCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM assay_reports WHERE user_id = ?',
      [userId]
    );
    
    const [customerCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE user_id = ?',
      [userId]
    );
    
    const [recentReports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.user_id = ? 
      ORDER BY ar.created_at DESC 
      LIMIT 5
    `, [userId]);

    // Get today's reports count
    const [todayReports] = await pool.execute(
      'SELECT COUNT(*) as count FROM assay_reports WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );

    res.json({
      totalReports: reportCount[0].count,
      totalCustomers: customerCount[0].count,
      todayReports: todayReports[0].count,
      recentReports
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Public Report View (for QR codes - no authentication required)
app.get('/api/public/reports/:id', async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name, c.phone, c.email 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ?
    `, [req.params.id]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Public report view error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// User Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, full_name } = req.body;
    
    if (!username || !email || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username or email already exists for other users
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email, username, req.user.userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const [result] = await pool.execute(
      `UPDATE users 
       SET username = ?, email = ?, full_name = ?
       WHERE id = ?`,
      [username, email, full_name, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: { id: req.user.userId, username, email, full_name }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Search endpoints
app.get('/api/search/customers', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const [customers] = await pool.execute(
      `SELECT id, name, phone, email 
       FROM customers 
       WHERE user_id = ? AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
       ORDER BY name LIMIT 10`,
      [req.user.userId, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(customers);
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/search/reports', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const [reports] = await pool.execute(
      `SELECT ar.*, c.name as customer_name 
       FROM assay_reports ar 
       LEFT JOIN customers c ON ar.customer_id = c.id 
       WHERE ar.user_id = ? AND (ar.serial_no LIKE ? OR c.name LIKE ?)
       ORDER BY ar.created_at DESC LIMIT 10`,
      [req.user.userId, `%${q}%`, `%${q}%`]
    );

    res.json(reports);
  } catch (error) {
    console.error('Search reports error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Analytics endpoints
app.get('/api/analytics/reports-by-date', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const [results] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM assay_reports 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date
    `, [req.user.userId, days]);

    res.json(results);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/analytics/reports-by-metal', authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT metal_type, COUNT(*) as count 
      FROM assay_reports 
      WHERE user_id = ?
      GROUP BY metal_type 
      ORDER BY count DESC
    `, [req.user.userId]);

    res.json(results);
  } catch (error) {
    console.error('Metal analytics error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get single customer by ID
app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, id_type, id_number } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const [result] = await pool.execute(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, id_type = ?, id_number = ?
       WHERE id = ? AND user_id = ?`,
      [name, phone, email, address, id_type, id_number, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      message: 'Customer updated successfully',
      customer: { 
        id: parseInt(req.params.id), 
        name, 
        phone, 
        email, 
        address, 
        id_type, 
        id_number 
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete customer
app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    
    // Check if this is a foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({ 
        error: 'Cannot delete customer. There are assay reports associated with this customer.' 
      });
    }
    
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get single report by ID
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ? AND ar.user_id = ?
    `, [req.params.id, req.user.userId]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update report
app.put('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, metal_type, fineness, weight, serial_no, assay_date, notes } = req.body;
    
    if (!customer_id || !fineness || !weight || !serial_no || !assay_date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const [result] = await pool.execute(
      `UPDATE assay_reports 
       SET customer_id = ?, metal_type = ?, fineness = ?, weight = ?, serial_no = ?, assay_date = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [customer_id, metal_type, fineness, weight, serial_no, assay_date, notes, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get updated report
    const [reports] = await pool.execute(`
      SELECT ar.*, c.name as customer_name 
      FROM assay_reports ar 
      LEFT JOIN customers c ON ar.customer_id = c.id 
      WHERE ar.id = ?
    `, [req.params.id]);

    res.json({ 
      message: 'Assay report updated successfully',
      report: reports[0]
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete report
app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM assay_reports WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// 404 handler for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Gold Assay System API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 XAMPP MySQL: localhost:3306`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using default'}`);
});