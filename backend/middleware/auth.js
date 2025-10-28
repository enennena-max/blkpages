// backend/middleware/auth.js
import jwt from "jsonwebtoken";

// Assumes you already set req.user elsewhere; this is a fallback decoder.
export function attachUserFromAuth(req, _res, next) {
  try {
    if (req.user) return next();
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
  } catch (_e) {}
  next();
}

export function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (role === "admin" || role === "staff") return next();
  return res.status(403).json({ message: "Access denied: Admin only" });
}
