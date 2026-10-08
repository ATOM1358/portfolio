// Netlify Serverless Function — Contact Form Proxy
// API key is stored in Netlify environment variable: WEB3FORMS_KEY
// This function acts as a secure proxy so the key is NEVER exposed to the browser.

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;       // max 5 submissions per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  return false;
}

// Sanitize input to prevent XSS/injection
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 2000); // limit length
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  // Rate limiting by client IP
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
                   || event.headers['client-ip']
                   || 'unknown';

  if (isRateLimited(clientIP)) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
      body: JSON.stringify({
        success: false,
        message: 'ส่งข้อความบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
      }),
    };
  }

  // Read API key from environment variable
  const accessKey = process.env.WEB3FORMS_KEY;
  if (!accessKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Server configuration error' }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Sanitize inputs
    const name = sanitize(body.name);
    const email = sanitize(body.email);
    const message = sanitize(body.message);

    // Basic validation
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }),
      };
    }

    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
      };
    }

    // Name length validation
    if (name.length < 2 || name.length > 100) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ชื่อต้องมีความยาว 2-100 ตัวอักษร' }),
      };
    }

    // Message length validation
    if (message.length < 10 || message.length > 2000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ข้อความต้องมีความยาว 10-2000 ตัวอักษร' }),
      };
    }

    // Forward to Web3Forms with the secret key injected server-side
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'New Message From Portfolio',
        from_name: 'Portfolio Website',
        name: name,
        email: email,
        message: message,
      }),
    });

    const result = await response.json();

    return {
      statusCode: response.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};
