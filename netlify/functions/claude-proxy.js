const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALLOWED_ORIGIN   = process.env.URL || '*';

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY environment variable not set.' } })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (_) {
    return { statusCode: 400, headers: corsHeaders, body: 'Invalid JSON' };
  }

  const useWebSearch = body._useWebSearch;
  delete body._useWebSearch;

  const headers = {
    'Content-Type':    'application/json',
    'x-api-key':       ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  };

  if (useWebSearch) {
    headers['anthropic-beta'] = 'web-search-2025-03-05';
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const responseBody = await anthropicRes.text();

  return {
    statusCode: anthropicRes.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: responseBody
  };
};
