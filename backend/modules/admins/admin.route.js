import { Router } from "express";

import {
    authenticate,
    authorize,
} from "../../middlewares/auth.middleware.js";

import * as adminController from "./admin.controller.js";

const router = Router();

const SUPER = ["SUPER_ADMIN"];

const ADMIN = ["ADMIN", "SUPER_ADMIN"];

/* =========================
   ADMIN MANAGEMENT
========================= */

router.get(
    "/",
    authenticate,
    authorize(...ADMIN),
    adminController.getAdmins
);

router.post(
    "/",
    authenticate,
    authorize(...SUPER),
    adminController.createAdmin
);

router.patch(
    "/:id",
    authenticate,
    authorize(...SUPER),
    adminController.updateAdmin
);

router.patch(
    "/:id/block",
    authenticate,
    authorize(...SUPER),
    adminController.toggleAdminBlock
);

router.delete(
    "/:id",
    authenticate,
    authorize(...SUPER),
    adminController.deleteAdmin
);

export default router;