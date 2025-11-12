import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gold_assay_system',
      port: 3306
    });

    console.log('🔐 Testing login process...');

    // Get admin user
    const [users] = await connection.execute('SELECT * FROM users WHERE username = "admin"');
    
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const user = users[0];
    console.log('✅ Found user:', user.username);

    // Test password
    const passwordValid = await bcrypt.compare('password', user.password);
    console.log('🔑 Password validation:', passwordValid);

    if (passwordValid) {
      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      console.log('✅ Login successful!');
      console.log('📝 Generated token:', token);
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token verified, payload:', decoded);
    } else {
      console.log('❌ Password invalid');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();