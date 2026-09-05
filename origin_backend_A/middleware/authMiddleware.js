const { User } = require('../models');

/**
 * Extracts identity from Authorization: Bearer <token>
 * Supports:
 * 1. Mock development JWTs: jwt_mock_<base64>
 * 2. Standard Supabase / OAuth JWTs: header.payload.signature
 * 3. Direct user / Supabase ID strings
 */
const extractIdentityFromToken = (token) => {
  if (!token || typeof token !== 'string') return null;

  const cleanToken = token.trim();
  if (!cleanToken) return null;

  // 1. Mock development JWT: jwt_mock_<base64>
  if (cleanToken.startsWith('jwt_mock_')) {
    try {
      const payloadBase64 = cleanToken.replace('jwt_mock_', '');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);

      // Check token expiration if present
      if (payload.exp && typeof payload.exp === 'number') {
        const isExpInSeconds = payload.exp < 10000000000;
        const expMs = isExpInSeconds ? payload.exp * 1000 : payload.exp;
        if (Date.now() > expMs) {
          return { error: 'Token has expired' };
        }
      }

      return {
        supabaseId: payload.id || payload.sub || null,
        email: payload.email || null,
        metadata: payload,
      };
    } catch (err) {
      console.warn('[authMiddleware] Failed to parse jwt_mock_ token:', err.message);
      return null;
    }
  }

  // 2. Standard Supabase or OAuth JWT (3 parts separated by '.')
  if (cleanToken.includes('.')) {
    try {
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
        const payload = JSON.parse(payloadJson);

        // Check expiration
        if (payload.exp && typeof payload.exp === 'number') {
          const isExpInSeconds = payload.exp < 10000000000;
          const expMs = isExpInSeconds ? payload.exp * 1000 : payload.exp;
          if (Date.now() > expMs) {
            return { error: 'Token has expired' };
          }
        }

        const supabaseId = payload.sub || payload.user_id || payload.id || null;
        const email = payload.email || payload.user_metadata?.email || null;

        return {
          supabaseId,
          email,
          metadata: payload,
        };
      }
    } catch (err) {
      console.warn('[authMiddleware] Failed to parse JWT payload:', err.message);
      return null;
    }
  }

  // 3. Fallback: Token is direct user or supabase identifier
  return {
    supabaseId: cleanToken,
    email: null,
    metadata: {},
  };
};

/**
 * Finds or provisions a user in SQLite from the extracted identity.
 */
const findOrCreateUserFromIdentity = async (identity) => {
  if (!identity || !identity.supabaseId) return null;

  // 1. Find by supabaseId
  let user = await User.findOne({
    where: { supabaseId: identity.supabaseId },
  });

  // 2. If not found by supabaseId, find by email
  if (!user && identity.email) {
    user = await User.findOne({
      where: { email: identity.email },
    });
    if (user && !user.supabaseId) {
      await user.update({ supabaseId: identity.supabaseId });
    }
  }

  // 3. If still not found, create new user profile in SQLite
  if (!user) {
    user = await User.create({
      supabaseId: identity.supabaseId,
      email: identity.email,
      age: 30,
      state: 'All India',
      occupation: 'General Citizen',
      language: 'en',
    });
    console.log(`✓ [authMiddleware] Provisioned SQLite user #${user.id} for Supabase ID ${identity.supabaseId}`);
  } else if (identity.email && !user.email) {
    await user.update({ email: identity.email });
  }

  return user;
};

/**
 * Optional Authentication Middleware
 * Resolves user from Authorization Bearer token or fallback headers if available, but does not block.
 */
const optionalAuthenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      const identity = extractIdentityFromToken(token);

      if (identity && identity.error) {
        return res.status(401).json({
          success: false,
          message: identity.error,
        });
      }

      if (identity) {
        const user = await findOrCreateUserFromIdentity(identity);
        if (user) {
          req.user = user;
          req.authIdentity = identity;
          return next();
        }
      }
    }

    // Check x-user-id header
    const explicitUserId = req.headers?.['x-user-id'] || req.query?.userId;
    if (explicitUserId) {
      let user = null;
      if (!isNaN(Number(explicitUserId))) {
        user = await User.findByPk(Number(explicitUserId));
      }
      if (!user) {
        user = await User.findOne({ where: { supabaseId: String(explicitUserId) } });
      }
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Unauthenticated request
    req.user = null;
    return next();
  } catch (err) {
    console.error('[authMiddleware] Error during optional authentication:', err);
    return next(err);
  }
};

/**
 * Strict Authentication Middleware
 * Requires a valid Authorization: Bearer <token>
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization Bearer token is required to access this endpoint.',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bearer token cannot be empty.',
      });
    }

    const identity = extractIdentityFromToken(token);
    if (!identity) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token format.',
      });
    }

    if (identity.error) {
      return res.status(401).json({
        success: false,
        message: identity.error,
      });
    }

    const user = await findOrCreateUserFromIdentity(identity);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed: unable to map identity to database profile.',
      });
    }

    req.user = user;
    req.authIdentity = identity;
    return next();
  } catch (err) {
    console.error('[authMiddleware] Error during required authentication:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying authentication credentials.',
    });
  }
};

module.exports = {
  extractIdentityFromToken,
  findOrCreateUserFromIdentity,
  optionalAuthenticateUser,
  requireAuth,
};

