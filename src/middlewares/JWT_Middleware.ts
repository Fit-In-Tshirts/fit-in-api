import { Request, Response ,NextFunction } from "express";
import { JWTPayload } from "../types/types";
import { verifyToken } from "../utils/jwt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

//check the incoming req for the token
//use this as a middleware function
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  //get the authorirzation from the request header
  const authHeader = req.headers['authorization'];
  //get the Bearer token from the authorization value
  const token = authHeader && authHeader.split(' ')[1];

  if(!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next()
  } catch(error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

//Middleware to check specific roles
export const requireRole = (allowedRoles: number[]) => {
  return (req:Request, res:Response, next:NextFunction) => {
    if(!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if(!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

///////////////////////
//Usage example

// 1. Protected route example

/*
router.get('/profile', authenticateToken, async (req, res) => {
  // req.user is now available with user data from JWT
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });
  
  res.json({ success: true, data: user });
});
*/


// 2. Role-based protection

/*
import Roles from '@types/roles'

router.get('/admin', authenticateToken, requireRole([Roles.ADMIN]), async (req, res) => {
  // Only admins can access this route
  res.json({ success: true, message: 'Admin only content' });
});
*/