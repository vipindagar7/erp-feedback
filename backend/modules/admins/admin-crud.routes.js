// backend/modules/admin/admin-crud.routes.js
import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as ctrl from "./admin-crud.controller.js";
import {
  validate,
  listQuerySchema,
  idParamSchema,
  createAdminSchema,
  updateAdminSchema,
} from "./admin-crud.validator.js";

const router = express.Router();
// Only SUPER_ADMIN or admins with manage_admins permission
const isSuper = [authenticate, authorize("SUPER_ADMIN")];
const isAdmin = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];

router.get(   "/",          ...isAdmin, validate(listQuerySchema, "query"), ctrl.listAdmins);
router.get(   "/:id",       ...isAdmin, validate(idParamSchema, "params"),  ctrl.getAdminById);
router.post(  "/",          ...isSuper, validate(createAdminSchema),        ctrl.createAdmin);
router.patch( "/:id",       ...isSuper, validate(idParamSchema, "params"),  validate(updateAdminSchema), ctrl.updateAdmin);
router.patch( "/:id/permissions", ...isSuper, validate(idParamSchema, "params"), ctrl.updatePermissions);
router.patch( "/:id/block", ...isSuper, validate(idParamSchema, "params"),  ctrl.blockAdmin);
router.delete("/:id",       ...isSuper, validate(idParamSchema, "params"),  ctrl.deleteAdmin);

export default router;
