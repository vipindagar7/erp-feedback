import jwt from "jsonwebtoken";
import prisma  from "../utils/prisma.js";

/**
 * authenticate — verifies access_token cookie, attaches req.user
 * Checks isBlocked on every request so blocking takes effect immediately.
 */
export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been blocked. Contact admin." });
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * authorize(...roles) — only allow listed roles through.
 * Usage: authorize("ADMIN", "SUPER_ADMIN")
 */
export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "You don't have permission to do this" });
    }
    next();
};

/**
 * requirePermission(key) — checks req.user.permissions array (admin sub-permissions).
 * SUPER_ADMIN always passes.
 */
export const requirePermission = (key) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (req.user.role === "SUPER_ADMIN") return next();
    if (!req.user.permissions?.includes(key)) {
        return res.status(403).json({ success: false, message: `Permission required: ${key}` });
    }
    next();
};