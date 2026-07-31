import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "MTk4ZThhYmMxMjM0NTY3ODlhYmNkZWYwMTIzNDU2NzhhYmNkZWYwMTIzNDU2NzhhYmNkZWYwMTIzNDU2Nzg=";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided, authorization denied." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is invalid or expired." });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }
    next();
  };
};

export const isStudent = requireRole(['STUDENT']);
export const isOwner = requireRole(['OWNER']);
export const isAdmin = requireRole(['ADMIN']);
export const isOwnerOrAdmin = requireRole(['OWNER', 'ADMIN']);
