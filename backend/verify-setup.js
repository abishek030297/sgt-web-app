import mysql from 'mysql2/promise';

async function verifySetup() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gold_assay_system',
      port: 3306
    });

    console.log('✅ Connected to database');

    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tables found:', tables.length);
    tables.forEach(table => {
      console.log('   -', table.Tables_in_gold_assay_system);
    });

    // Check admin user
    const [users] = await connection.execute('SELECT * FROM users WHERE username = "admin"');
    console.log('👤 Admin user:', users.length > 0 ? '✅ Found' : '❌ Missing');
    
    if (users.length > 0) {
      console.log('   Username:', users[0].username);
      console.log('   Email:', users[0].email);
    }

    // Check customers
    const [customers] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    console.log('👥 Customers:', customers[0].count);

    // Check reports
    const [reports] = await connection.execute('SELECT COUNT(*) as count FROM assay_reports');
    console.log('📋 Reports:', reports[0].count);

    await connection.end();
    console.log('🎉 Setup verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySetup();