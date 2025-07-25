

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, message, user_id } = await req.json();
    
    console.log('Received message:', { session_id, message, user_id });

    // Get the webhook URL and auth header from environment
    const webhookUrl = Deno.env.get('NOTEBOOK_CHAT_URL');
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    
    if (!webhookUrl) {
      console.error('NOTEBOOK_CHAT_URL environment variable not set. Please add this secret in Supabase Dashboard -> Edge Functions -> Secrets');
      throw new Error('NOTEBOOK_CHAT_URL environment variable not set. Please configure this secret in your Supabase project dashboard under Edge Functions -> Secrets. The value should be your n8n webhook URL (e.g., https://your-n8n-instance.com/webhook/2fabf43f-6e6e-424b-8e93-9150e9ce7d6c)');
    }

    if (!authHeader) {
      console.error('NOTEBOOK_GENERATION_AUTH environment variable not set. Please add this secret in Supabase Dashboard -> Edge Functions -> Secrets');
      throw new Error('NOTEBOOK_GENERATION_AUTH environment variable not set. Please configure this secret in your Supabase project dashboard under Edge Functions -> Secrets. This should be the authentication header value for your n8n webhook.');
    }

    console.log('Sending to webhook with auth header');

    // Send message to n8n webhook with authentication
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        session_id,
        message,
        user_id,
        timestamp: new Date().toISOString()
      })
    });

    if (!webhookResponse.ok) {
      console.error(`Webhook responded with status: ${webhookResponse.status}`);
      const errorText = await webhookResponse.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook response:', webhookData);

    return new Response(
      JSON.stringify({ success: true, data: webhookData }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-chat-message:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send message to webhook' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});

