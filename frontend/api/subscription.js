// api/subscription.js
// Vercel serverless function for subscription management

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Get user subscription status
async function getStatus(req, res, userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_plan, subscription_expires_at')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const expiresAt = data.subscription_expires_at;
    const daysLeft = expiresAt
      ? Math.ceil((new Date(expiresAt) - Date.now()) / 86_400_000)
      : null;

    return res.status(200).json({
      plan: data.subscription_plan || 'gratis',
      expiresAt,
      daysLeft,
      status: !expiresAt ? 'unlimited' : daysLeft > 0 ? 'active' : 'expired',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Confirm payment via WhatsApp callback
// POST { userId, plan, period, paymentRef, priceInRp, expiresAt }
async function confirmPayment(req, res) {
  const { userId, plan, period, paymentRef, priceInRp, expiresAt } = req.body;

  if (!userId || !plan || !period || !paymentRef || !expiresAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Validate plan
    const validPlans = ['gratis', 'starter', 'pro'];
    if (!validPlans.includes(plan)) {
      throw new Error('Invalid plan');
    }

    // Update user's subscription in database
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_expires_at: expiresAt,
      })
      .eq('user_id', userId)
      .select();

    if (error) throw error;

    // Log payment in subscriptions table
    const { error: auditError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        period,
        price_paid: priceInRp / 10000, // Convert Rp to ~USD for storage
        payment_ref: paymentRef,
        expires_at: expiresAt,
        is_active: true,
      });

    if (auditError) throw auditError;

    return res.status(200).json({
      success: true,
      message: `Subscription activated: ${plan.toUpperCase()}`,
      expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Get subscription history
async function getHistory(req, res, userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Main handler
export default async function handler(req, res) {
  const { action, userId } = req.query;

  // Validate auth (in production, verify JWT token)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (action) {
    case 'status':
      return getStatus(req, res, parseInt(userId));
    case 'confirm':
      return confirmPayment(req, res);
    case 'history':
      return getHistory(req, res, parseInt(userId));
    default:
      return res.status(404).json({ error: 'Unknown action' });
  }
}
