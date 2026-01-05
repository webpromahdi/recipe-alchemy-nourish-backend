import { verifyToken } from "../config/firebase.js";

/**
 * Authentication middleware
 * Verifies Firebase ID token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "No authentication token provided",
        },
        timestamp: new Date(),
      });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify token with Firebase
    const decodedToken = await verifyToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token",
      },
      timestamp: new Date(),
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't block if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await verifyToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
      };
    }

    next();
  } catch (error) {
    // Don't block request if token verification fails
    next();
  }
};

export default { authenticate, optionalAuth };
