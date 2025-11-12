import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function testAuth() {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gold_assay_system',
      port: 3306
    });

    console.log('✅ Database connected');

    // Check if admin user exists
    const [users] = await connection.execute('SELECT * FROM users WHERE username = "admin"');
    
    if (users.length === 0) {
      console.log('❌ Admin user not found in database');
      return;
    }

    const adminUser = users[0];
    console.log('✅ Admin user found:', adminUser.username);
    console.log('📧 Email:', adminUser.email);
    
    // Test password verification
    const testPassword = 'password';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    
    console.log('🔑 Password test:');
    console.log('   Input password:', testPassword);
    console.log('   Stored hash:', adminUser.password.substring(0, 20) + '...');
    console.log('   Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password verification failed!');
      console.log('💡 Try resetting the admin password...');
      
      // Reset admin password
      const newHash = await bcrypt.hash('password', 10);
      await connection.execute(
        'UPDATE users SET password = ? WHERE username = "admin"',
        [newHash]
      );
      console.log('✅ Admin password reset to "password"');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();