import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max attempts per email in window
const MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP in window
const RATE_LIMIT_WINDOW_MINUTES = 15; // Time window in minutes
const LOCKOUT_DURATION_MINUTES = 30; // Lockout duration after too many failures

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Service client for rate limiting (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Parse request body
    const { email, password, action } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

    // Check rate limit by email
    const { data: emailAttempts, error: emailError } = await serviceClient
      .from('login_attempts')
      .select('id, successful')
      .eq('email', email.toLowerCase())
      .gte('attempted_at', windowStart)
      .order('attempted_at', { ascending: false });

    if (emailError) {
      console.error('Error checking email rate limit:', emailError);
    }

    const failedEmailAttempts = (emailAttempts || []).filter(a => !a.successful).length;

    if (failedEmailAttempts >= MAX_ATTEMPTS_PER_EMAIL) {
      console.log(`Rate limit exceeded for email: ${email}`);
      
      // Record the blocked attempt
      await serviceClient.from('login_attempts').insert({
        email: email.toLowerCase(),
        ip_address: clientIP,
        successful: false,
      });

      return new Response(
        JSON.stringify({ 
          error: `Too many failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
          locked: true,
          lockoutMinutes: LOCKOUT_DURATION_MINUTES
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit by IP
    const { data: ipAttempts, error: ipError } = await serviceClient
      .from('login_attempts')
      .select('id, successful')
      .eq('ip_address', clientIP)
      .gte('attempted_at', windowStart)
      .order('attempted_at', { ascending: false });

    if (ipError) {
      console.error('Error checking IP rate limit:', ipError);
    }

    const failedIpAttempts = (ipAttempts || []).filter(a => !a.successful).length;

    if (failedIpAttempts >= MAX_ATTEMPTS_PER_IP) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts from this location. Please try again later.',
          locked: true,
          lockoutMinutes: LOCKOUT_DURATION_MINUTES
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create anon client for actual auth
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    let result;
    
    if (action === 'signup') {
      // Sign up
      result = await anonClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${req.headers.get('origin') || supabaseUrl}/`,
          data: {
            name: '',
          }
        }
      });
    } else {
      // Sign in
      result = await anonClient.auth.signInWithPassword({
        email,
        password,
      });
    }

    // Record the attempt
    await serviceClient.from('login_attempts').insert({
      email: email.toLowerCase(),
      ip_address: clientIP,
      successful: !result.error,
    });

    if (result.error) {
      console.log(`Login failed for ${email}: ${result.error.message}`);
      
      // Calculate remaining attempts
      const remainingAttempts = MAX_ATTEMPTS_PER_EMAIL - failedEmailAttempts - 1;
      
      let errorMessage = result.error.message;
      if (result.error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          remainingAttempts: Math.max(0, remainingAttempts),
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Login successful for ${email}`);

    // Check if email verification is required
    const user = result.data.user;
    const session = result.data.session;
    
    // For signup, inform about email verification
    if (action === 'signup' && user && !user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          success: true,
          requiresEmailVerification: true,
          message: 'Please check your email to verify your account.',
          user: {
            id: user.id,
            email: user.email,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session,
        user: user ? {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Authentication service error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
