const axios = require('axios');

/**
 * Proxies chat requests to Person B's AI service (http://localhost:3000/api/chat)
 * Request body: { message, language, schemeId, profile, conversation }
 * Fallback response if Person B's service is down:
 * { error: 'AI service unavailable', fallback: true }
 */
const proxyChat = async (req, res) => {
  try {
    const { message, language, schemeId, profile, conversation } = req.body;

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3000/api/chat';
    // Explicit 25-30s timeout for Person A to Person B AI proxy requests
    const timeout = parseInt(process.env.AI_SERVICE_TIMEOUT || process.env.AI_PROXY_TIMEOUT, 10) || 30000;

    const response = await axios.post(
      aiServiceUrl,
      {
        message,
        language,
        schemeId,
        profile,
        conversation,
      },
      {
        timeout, // 30,000 ms (30 seconds)
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(response.status || 200).json(response.data);
  } catch (error) {
    console.error('AI Service Proxy Error:', error.message);

    // Return safe fallback JSON response
    return res.status(503).json({
      error: 'AI service unavailable',
      fallback: true,
    });
  }
};

module.exports = {
  proxyChat,
};

