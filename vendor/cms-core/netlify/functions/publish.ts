import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const netlifyBuildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase not configured' }),
    };
  }

  // Verify auth token from request
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authorization header required' }),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Verify the token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    };
  }

  // Check if build hook is configured
  if (!netlifyBuildHookUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Build hook not configured',
        message: 'Please set NETLIFY_BUILD_HOOK_URL environment variable'
      }),
    };
  }

  try {
    // Trigger Netlify build hook
    const response = await fetch(netlifyBuildHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Build hook returned ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Build triggered successfully',
        user: user.email,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error triggering build:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to trigger build',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
