import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gold_assay_system'
    });

    console.log('✅ MySQL Connection Successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT * FROM users');
    console.log('✅ Users table test successful');
    console.log('Users found:', rows.length);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection();