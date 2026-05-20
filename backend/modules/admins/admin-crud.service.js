// backend/modules/admin/admin-crud.service.js
import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma.js";
import { createNotification } from "../notification/notification.js";

export const listAdminsService = async ({ page = 1, limit = 20, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    role: { in: ["ADMIN", "SUPER_ADMIN"] },
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { admin: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { admin: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const admins = users.map((u) => ({
    id: u.admin?.id ?? u.id,
    user_id: u.id,
    name: u.admin?.name ?? "—",
    email: u.email,
    role: u.role,
    permissions: u.permissions,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
  }));

  return { admins, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getAdminByIdService = async (id) => {
  const admin = await prisma.admin.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, role: true, permissions: true, isBlocked: true, createdAt: true } } },
  });
  if (!admin) return null;
  return {
    id: admin.id,
    user_id: admin.user_id,
    name: admin.name,
    email: admin.user.email,
    role: admin.user.role,
    permissions: admin.user.permissions,
    isBlocked: admin.user.isBlocked,
    createdAt: admin.user.createdAt,
  };
};

export const createAdminService = async ({ name, email, password, permissions = [] }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "email_taken" };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      permissions,
      admin: { create: { name } },
    },
    include: { admin: true },
  });

  return {
    admin: {
      id: user.admin.id,
      user_id: user.id,
      name: user.admin.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
  };
};

export const updateAdminService = async (id, { name, permissions }) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;

  await prisma.$transaction([
    ...(name !== undefined
      ? [prisma.admin.update({ where: { id }, data: { name } })]
      : []),
    ...(permissions !== undefined
      ? [prisma.user.update({ where: { id: admin.user_id }, data: { permissions } })]
      : []),
  ]);

  return getAdminByIdService(id);
};

export const updatePermissionsService = async (id, permissions) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;

  await prisma.user.update({
    where: { id: admin.user_id },
    data: { permissions },
  });

  return getAdminByIdService(id);
};

export const blockAdminService = async (id) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;

  const updated = await prisma.user.update({
    where: { id: admin.user_id },
    data: { isBlocked: !admin.user.isBlocked },
  });

  createNotification({
    user_id: admin.user_id,
    type: updated.isBlocked ? "ACCOUNT_BLOCKED" : "ACCOUNT_UNBLOCKED",
    title: updated.isBlocked ? "Account Blocked" : "Account Unblocked",
    message: updated.isBlocked
      ? "Your admin account has been blocked."
      : "Your admin account has been unblocked.",
  });

  return { isBlocked: updated.isBlocked };
};

export const deleteAdminService = async (
  id,
  requestingUserId
) => {
  const admin = await prisma.admin.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!admin) {
    return { error: "not_found" };
  }

  // Prevent deleting super admin
  if (admin.user.role === "SUPER_ADMIN") {
    return { error: "cannot_delete_super_admin" };
  }

  // Prevent deleting self
  if (admin.user_id === requestingUserId) {
    return { error: "cannot_delete_self" };
  }

  // Delete admin first
  await prisma.admin.delete({
    where: { id },
  });

  // Delete linked user
  await prisma.user.delete({
    where: {
      id: admin.user_id,
    },
  });

  return {
    success: true,
    message: "Admin and linked user deleted successfully",
  };
};
