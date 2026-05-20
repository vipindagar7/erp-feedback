import { Router } from "express";

import {
    authenticate,
    authorize,
} from "../../middlewares/auth.middleware.js";

import * as adminController from "./admin.controller.js";

const router = Router();

const ADMIN = ["ADMIN", "SUPER_ADMIN"];


router.get(
    "/dashboard/stats",
    authenticate,
    authorize(...ADMIN),
    adminController.getDashboardStats
);

router.get(
    "/dashboard/activity",
    authenticate,
    authorize(...ADMIN),
    adminController.getDashboardActivity
);

/* =========================
   REPORTS
========================= */

router.get(
    "/reports/students",
    authenticate,
    authorize(...ADMIN),
    adminController.exportStudentsReport
);

router.get(
    "/reports/faculty",
    authenticate,
    authorize(...ADMIN),
    adminController.exportFacultyReport
);

router.get(
    "/reports/enrollments",
    authenticate,
    authorize(...ADMIN),
    adminController.exportEnrollmentReport
);

export default router;