import express from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Debug: Log environment variables on startup
console.log('🔧 Payment Gateway Initialization:');
console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set (' + process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...)' : '❌ Not set');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Not set');

// Initialize Stripe
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_default');

// Initialize Razorpay
const razorpayInstance = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
}) : null;

console.log('   Stripe Instance:', stripeInstance ? '✅ Initialized' : '❌ Failed');
console.log('   Razorpay Instance:', razorpayInstance ? '✅ Initialized' : '❌ Failed');

// Store to track payments (in production, use database)
const paymentsStore = new Map();

// Middleware to authenticate payments (use your existing auth middleware)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // You can verify token here and set req.user
  // For now, we'll assume it's valid
  req.user = { userId: 1 }; // This should come from JWT verification
  next();
};

// Get Stripe Public Key
router.get('/stripe/public-key', (req, res) => {
  try {
    res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_default' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Razorpay Key ID
router.get('/razorpay/key-id', (req, res) => {
  try {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe Payment Intent
router.post('/stripe/create-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, description, customerId, reportId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      description: description || 'Assay Service Payment',
      metadata: {
        customerId,
        reportId,
        userId: req.user.userId
      }
    });

    // Store payment record
    paymentsStore.set(paymentIntent.id, {
      id: paymentIntent.id,
      customerId,
      reportId,
      amount,
      currency,
      status: 'pending',
      gateway: 'stripe',
      createdAt: new Date()
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm Stripe Payment
router.post('/stripe/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID required' });
    }

    // Retrieve payment intent
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment record
      const paymentRecord = paymentsStore.get(paymentIntentId);
      if (paymentRecord) {
        paymentRecord.status = 'completed';
        paymentRecord.confirmedAt = new Date();
      }

      res.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'completed',
        customerId: paymentIntent.metadata?.customerId,
        reportId: paymentIntent.metadata?.reportId,
        createdAt: new Date(paymentIntent.created * 1000)
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Razorpay Order
router.post('/razorpay/create-order', authenticateToken, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpayInstance) {
      return res.status(500).json({ error: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' });
    }

    const { amount, currency, description, customerId, reportId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency: currency || 'INR',
      receipt: `assay_${Date.now()}`,
      notes: {
        customerId,
        reportId,
        userId: req.user.userId,
        description
      }
    });
    console.log(order, 'order');

    // Store payment record
    paymentsStore.set(order.id, {
      id: order.id,
      customerId,
      reportId,
      amount,
      currency,
      status: 'pending',
      gateway: 'razorpay',
      createdAt: new Date()
    });

    res.json({
      id: order.id,
      amount: order.amount / 100,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Razorpay Payment
router.post('/razorpay/verify', authenticateToken, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpayInstance) {
      return res.status(500).json({ error: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' });
    }

    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Fetch payment details
    const payment = await razorpayInstance.payments.fetch(paymentId);

    if (payment.status === 'captured' || payment.status === 'authorized') {
      // Update payment record
      const paymentRecord = paymentsStore.get(orderId);
      if (paymentRecord) {
        paymentRecord.status = 'completed';
        paymentRecord.paymentId = paymentId;
        paymentRecord.confirmedAt = new Date();
      }

      res.json({
        id: paymentId,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'completed',
        customerId: payment.notes?.customerId,
        reportId: payment.notes?.reportId,
        createdAt: new Date(payment.created_at * 1000)
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Payment History
router.get('/history', authenticateToken, (req, res) => {
  try {
    const payments = Array.from(paymentsStore.values()).map(payment => ({
      ...payment,
      createdAt: payment.createdAt.toISOString()
    }));

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Payment by ID
router.get('/:paymentId', authenticateToken, (req, res) => {
  try {
    const payment = paymentsStore.get(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      ...payment,
      createdAt: payment.createdAt.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refund Payment
router.post('/:paymentId/refund', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const payment = paymentsStore.get(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.gateway === 'stripe') {
      // Refund via Stripe
      const refund = await stripeInstance.refunds.create({
        payment_intent: req.params.paymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      payment.status = 'refunded';
      payment.refundId = refund.id;

      res.json({
        id: refund.id,
        status: 'refunded',
        amount: refund.amount / 100
      });
    } else if (payment.gateway === 'razorpay') {
      // Refund via Razorpay
      const refund = await razorpayInstance.refunds.create({
        payment_id: payment.paymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      payment.status = 'refunded';
      payment.refundId = refund.id;

      res.json({
        id: refund.id,
        status: 'refunded',
        amount: refund.amount / 100
      });
    }
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
