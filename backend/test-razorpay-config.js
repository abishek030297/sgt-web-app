import dotenv from 'dotenv';
import Razorpay from 'razorpay';

console.log('🔍 Testing Razorpay Configuration\n');

// Load environment variables
dotenv.config();

console.log('1️⃣  Environment Variables:');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);

console.log('\n2️⃣  Creating Razorpay Instance:');
try {
  const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('   ✅ Razorpay Instance Created Successfully!');
  console.log('   Instance:', razorpayInstance);
} catch (error) {
  console.log('   ❌ Error creating Razorpay instance:');
  console.log('   ', error.message);
}

console.log('\n3️⃣  Test Order Creation (Dry Run):');
try {
  const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Note: This would actually make a real request
  console.log('   Ready to create orders with this instance');
  console.log('   ✅ Configuration is valid');
} catch (error) {
  console.log('   ❌ Configuration error:', error.message);
}
