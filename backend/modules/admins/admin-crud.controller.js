// backend/modules/admin/admin-crud.controller.js
import * as svc from "./admin-crud.service.js";

const ok      = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const notFound = (res, msg = "Not found") => res.status(404).json({ success: false, message: msg });
const fail     = (res, msg = "Internal server error") => res.status(500).json({ success: false, message: msg });

export const listAdmins = async (req, res) => {
  try {
    const { page, limit, search } = req.validated ?? req.query;
    const data = await svc.listAdminsService({ page, limit, search });
    ok(res, data);
  } catch (e) { console.error("[AdminCRUD] listAdmins:", e); fail(res); }
};

export const getAdminById = async (req, res) => {
  try {
    const data = await svc.getAdminByIdService(req.params.id);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res); }
};

export const createAdmin = async (req, res) => {
  try {
    const result = await svc.createAdminService(req.body);
    if (result.error === "email_taken")
      return res.status(409).json({ success: false, message: "Email already in use" });
    ok(res, result, 201);
  } catch (e) { console.error("[AdminCRUD] createAdmin:", e); fail(res); }
};

export const updateAdmin = async (req, res) => {
  try {
    const data = await svc.updateAdminService(req.params.id, req.body);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res); }
};

export const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions))
      return res.status(400).json({ success: false, message: "permissions must be an array" });
    const data = await svc.updatePermissionsService(req.params.id, permissions);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res); }
};

export const blockAdmin = async (req, res) => {
  try {
    const data = await svc.blockAdminService(req.params.id);
    if (!data) return notFound(res);
    ok(res, data);
  } catch (e) { fail(res); }
};

export const deleteAdmin = async (req, res) => {
  try {
    const result = await svc.deleteAdminService(req.params.id, req.user.id);
    if (result.error === "not_found")                return notFound(res);
    if (result.error === "cannot_delete_super_admin") return res.status(403).json({ success: false, message: "Cannot delete a Super Admin" });
    if (result.error === "cannot_delete_self")        return res.status(403).json({ success: false, message: "You cannot delete your own account" });
    ok(res, { message: "Admin deleted" });
  } catch (e) { fail(res); }
};
