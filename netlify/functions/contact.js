// Netlify Serverless Function — Contact Form Proxy
// API key is stored in Netlify environment variable: WEB3FORMS_KEY
// This function acts as a secure proxy so the key is NEVER exposed to the browser.

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
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

    // Basic validation
    if (!body.name || !body.email || !body.message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }),
      };
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
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
        name: body.name,
        email: body.email,
        message: body.message,
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
