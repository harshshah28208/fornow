const { verifyToken } = require('../utils/token');
const prisma = require('../config/db');
const { error } = require('../utils/responseHelper');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication token missing or invalid', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return error(res, 'Token is invalid or expired', null, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
      },
    });

    if (!user || !user.isActive) {
      return error(res, 'User account is inactive or not found', null, 401);
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return error(res, 'Authentication error', err.message, 401);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Unauthorized', null, 401);
    }

    // SUPER_ADMIN and ORG_ADMIN can access all admin-level routes
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return error(res, `Forbidden: Role '${req.user.role}' is not authorized for this action`, null, 403);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};
