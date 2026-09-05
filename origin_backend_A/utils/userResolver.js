const { User } = require('../models');
const { extractIdentityFromToken, findOrCreateUserFromIdentity } = require('../middleware/authMiddleware');

/**
 * Extracts identity from Authorization: Bearer <token>
 * Supports:
 * - Supabase JWTs (header.payload.signature)
 * - Mock development JWTs (jwt_mock_<base64>)
 * - Direct user IDs
 */
const extractIdentityFromAuthHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1].trim();
  if (!token) return null;

  return extractIdentityFromToken(token);
};

/**
 * Resolves the active user profile from the request.
 * Checks (in order):
 * 0. req.user (if already resolved by authMiddleware)
 * 1. Authorization: Bearer <token> (Supabase or mock JWT)
 * 2. x-user-id header
 * 3. query param userId
 * 4. body param userId
 * 5. First user found in database
 * 6. Creates a default user if database has none
 */
const resolveUser = async (req) => {
  // 0. If middleware already set req.user, return it directly
  if (req.user) {
    return req.user;
  }

  // 1. Check Authorization Bearer header
  const authHeader = req.headers?.authorization;
  const authIdentity = extractIdentityFromAuthHeader(authHeader);

  if (authIdentity && authIdentity.supabaseId && !authIdentity.error) {
    const user = await findOrCreateUserFromIdentity(authIdentity);
    if (user) {
      req.user = user;
      req.authIdentity = authIdentity;
      return user;
    }
  }

  // 2. Check x-user-id header / query / body
  const userId = req.headers?.['x-user-id'] || req.query?.userId || req.body?.userId;

  if (userId) {
    let user = null;
    if (!isNaN(Number(userId))) {
      user = await User.findByPk(Number(userId));
    }
    if (!user) {
      user = await User.findOne({ where: { supabaseId: String(userId) } });
    }
    if (user) {
      return user;
    }
  }

  // 3. Fallback to first existing user profile
  let defaultUser = await User.findOne({ order: [['id', 'ASC']] });

  // 4. If no user exists in DB yet, create a default profile
  if (!defaultUser) {
    defaultUser = await User.create({
      age: 35,
      state: 'Uttar Pradesh',
      occupation: 'Farmer',
      language: 'hi',
    });
  }

  return defaultUser;
};

module.exports = {
  resolveUser,
  extractIdentityFromAuthHeader,
};

