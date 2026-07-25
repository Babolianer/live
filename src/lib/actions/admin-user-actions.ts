"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import type { UserRole } from "@/lib/auth";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export async function listUsers() {
  await requireAdmin();
  return query<AdminUserRow[]>(
    `SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC`
  );
}

export async function setUserRoleAction(userId: string, role: UserRole) {
  const admin = await requireAdmin();
  if (admin.id === userId && role !== "admin") {
    // Prevent an admin from locking themselves out of the admin panel.
    return;
  }
  await query(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
  revalidatePath("/admin");
}
