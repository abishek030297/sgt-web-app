import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';

function setupXAMPPDatabase() {
  // Create connection (not pool) for setup
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // Empty for XAMPP
    port: 3306,
    multipleStatements: true  // This allows multiple SQL statements
  });

  connection.connect(async (err) => {
    if (err) {
      console.error('❌ Connection failed:', err.message);
      return;
    }

    console.log('✅ Connected to XAMPP MySQL');

    try {
      // Read the schema file
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('📦 Setting up database...');
      
      // Execute the entire schema
      connection.query(schema, (error, results) => {
        if (error) {
          console.log('ℹ️ Note (some errors are normal):', error.message);
        } else {
          console.log('✅ Schema executed successfully');
        }

        // Test the setup
        testSetup();
      });

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      connection.end();
    }
  });

  function testSetup() {
    console.log('🧪 Testing setup...');
    
    // Switch to our database
    connection.query('USE gold_assay_system', (err) => {
      if (err) {
        console.log('❌ Database not created yet, creating it...');
        createDatabase();
        return;
      }

      // Check if tables exist
      connection.query('SHOW TABLES', (err, results) => {
        if (err) {
          console.error('❌ Error checking tables:', err.message);
        } else {
          console.log('✅ Tables found:', results.length);
          results.forEach(table => {
            console.log('   -', table[`Tables_in_gold_assay_system`]);
          });
        }

        // Check if admin user exists
        connection.query('SELECT * FROM users WHERE username = "admin"', (err, users) => {
          if (err) {
            console.log('ℹ️ Users table not ready yet');
          } else {
            console.log('✅ Admin user found:', users.length > 0);
            if (users.length > 0) {
              console.log('   👤 Username: admin');
              console.log('   🔑 Password: password');
            }
          }
          
          connection.end();
          console.log('🎉 Database setup completed!');
        });
      });
    });
  }

  function createDatabase() {
    connection.query('CREATE DATABASE IF NOT EXISTS gold_assay_system', (err) => {
      if (err) {
        console.error('❌ Error creating database:', err.message);
        connection.end();
        return;
      }
      
      console.log('✅ Database created');
      
      // Now use the database and create tables
      connection.query('USE gold_assay_system', (err) => {
        if (err) {
          console.error('❌ Error using database:', err.message);
          connection.end();
          return;
        }
        
        // Create tables manually
        createTables();
      });
    });
  }

  function createTables() {
    const tablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Assay reports table
      CREATE TABLE IF NOT EXISTS assay_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        customer_id INT NOT NULL,
        metal_type VARCHAR(50) DEFAULT 'Gold',
        fineness DECIMAL(5,2) NOT NULL,
        weight VARCHAR(50) NOT NULL,
        serial_no VARCHAR(100) NOT NULL,
        assay_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `;

    connection.query(tablesSQL, (err) => {
      if (err) {
        console.error('❌ Error creating tables:', err.message);
        connection.end();
        return;
      }
      
      console.log('✅ Tables created');
      insertSampleData();
    });
  }

  function insertSampleData() {
    const sampleDataSQL = `
      -- Insert sample admin user (password: password)
      INSERT IGNORE INTO users (username, email, password, full_name) VALUES 
      ('admin', 'admin@goldassay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator');

      -- Insert sample customer
      INSERT IGNORE INTO customers (user_id, name, phone, email, address, id_type, id_number) VALUES 
      (1, 'Shakeover', '+1234567890', 'shakeover@example.com', 'R.C Street, Marchandam', 'Passport', 'AB123456');

      -- Insert sample assay report
      INSERT IGNORE INTO assay_reports (user_id, customer_id, metal_type, fineness, weight, serial_no, assay_date) VALUES 
      (1, 1, 'Gold', 91.70, '0.50 ml', '8601', '2025-01-23');
    `;

    connection.query(sampleDataSQL, (err) => {
      if (err) {
        console.log('ℹ️ Note (sample data):', err.message);
      } else {
        console.log('✅ Sample data inserted');
      }
      
      testSetup();
    });
  }
}

setupXAMPPDatabase();