import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',  // Empty for XAMPP
      port: 3306
    });

    console.log('✅ Connected to XAMPP MySQL');

    // Read and execute the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.log('ℹ️ Note:', error.message);
          }
        }
      }
    }

    console.log('✅ Database setup completed!');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupDatabase();