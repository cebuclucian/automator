// Supabase Edge Function to create a Stripe checkout session
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.12.0';

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Price ID mapping (in production, these would be actual Stripe price IDs)
const PRICES = {
  'price_basic': {
    amount: 1900, // €19.00
    name: 'Basic Plan',
    recurringInterval: 'month',
    generationsPerMonth: 3,
  },
  'price_pro': {
    amount: 4900, // €49.00
    name: 'Pro Plan',
    recurringInterval: 'month',
    generationsPerMonth: 10,
  },
  'price_enterprise': {
    amount: 12900, // €129.00
    name: 'Enterprise Plan',
    recurringInterval: 'month',
    generationsPerMonth: 30,
  },
};

Deno.serve(async (req) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { priceId, userId, customerEmail, successUrl, cancelUrl } = await req.json();

    if (!priceId || !userId || !customerEmail || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get price details (in production, we would fetch this from Stripe)
    const priceDetails = PRICES[priceId];
    if (!priceDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripeCustomerId')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    // Get or create customer
    let customerId = userData.stripeCustomerId;
    if (!customerId) {
      // In production, this would actually create a Stripe customer
      // For demo purposes, we'll just generate a fake ID
      customerId = `cus_${Math.random().toString(36).substring(2, 15)}`;
      
      // Update user with fake customer ID
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripeCustomerId: customerId })
        .eq('id', userId);
      
      if (updateError) {
        throw new Error(`Error updating user: ${updateError.message}`);
      }
    }

    // In production, this would create a real Stripe Checkout session
    // For demo purposes, we'll just return a fake checkout URL
    const checkoutUrl = `${successUrl}`;

    // Return success response
    return new Response(
      JSON.stringify({
        checkoutUrl,
        customerId,
        priceId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});