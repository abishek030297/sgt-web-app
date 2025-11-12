import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Test JWT token creation
const testPayload = { userId: 1, username: 'test' };
const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });

console.log('✅ JWT Secret is configured');
console.log('📝 Test token created:', token.substring(0, 50) + '...');

// Verify the token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  console.log('✅ Token verification successful');
  console.log('📋 Decoded payload:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}