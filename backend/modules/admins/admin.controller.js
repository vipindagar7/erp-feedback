import * as adminService from "./admin.service.js";

/* =========================
   GET ADMINS
========================= */

export const getAdmins = async (
    req,
    res,
    next
) => {
    try {
        const admins =
            await adminService.getAllAdmins();

        return res.status(200).json({
            success: true,
            data: admins,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   CREATE ADMIN
========================= */

export const createAdmin = async (
    req,
    res,
    next
) => {
    try {
        const admin =
            await adminService.createAdmin(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Admin created",
            data: admin,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   UPDATE ADMIN
========================= */

export const updateAdmin = async (
    req,
    res,
    next
) => {
    try {
        const admin =
            await adminService.updateAdmin(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: admin,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   BLOCK / UNBLOCK
========================= */

export const toggleAdminBlock = async (
    req,
    res,
    next
) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "Cannot block yourself",
            });
        }

        const admin =
            await adminService.toggleBlock(
                req.params.id,
                req.body.isBlocked
            );

        return res.status(200).json({
            success: true,
            message: req.body.isBlocked
                ? "Blocked"
                : "Unblocked",
            data: admin,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   DELETE ADMIN
========================= */

export const deleteAdmin = async (
    req,
    res,
    next
) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete your own account",
            });
        }

        await adminService.deleteAdmin(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Deleted",
        });
    } catch (error) {
        next(error);
    }
};