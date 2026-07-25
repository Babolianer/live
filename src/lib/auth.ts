import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { query, newId, nowIso } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";

const SESSION_DAYS = 30;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

export type UserRole = "user" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  onboardingDismissed: boolean;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Valid-format bcrypt hash with no matching password — used to keep login
// timing constant when the email doesn't exist (avoids account enumeration).
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync("no-such-account", 12);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await query(
    `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [hashToken(token), userId, expiresAt, nowIso()]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await query(`DELETE FROM sessions WHERE id = ?`, [hashToken(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await query<
    {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      onboarding_dismissed: number;
      expires_at: string;
    }[]
  >(
    `SELECT u.id, u.email, u.name, u.role, u.onboarding_dismissed, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [hashToken(token)]
  );

  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    onboardingDismissed: row.onboarding_dismissed === 1,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function createUser(email: string, password: string, name: string) {
  const id = newId();
  const passwordHash = await hashPassword(password);
  await query(
    `INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, email.toLowerCase().trim(), passwordHash, name.trim(), nowIso()]
  );
  return id;
}

export async function findUserByEmail(email: string) {
  const rows = await query<{ id: string; email: string; password_hash: string; name: string }[]>(
    `SELECT id, email, password_hash, name FROM users WHERE email = ?`,
    [email.toLowerCase().trim()]
  );
  return rows[0] ?? null;
}

export async function isLoginLocked(email: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND created_at > ?`,
    [email.toLowerCase().trim(), since]
  );
  return (rows[0]?.count ?? 0) >= LOGIN_MAX_ATTEMPTS;
}

export async function recordFailedLogin(email: string): Promise<void> {
  await query(`INSERT INTO login_attempts (id, email, created_at) VALUES (?, ?, ?)`, [
    newId(),
    email.toLowerCase().trim(),
    nowIso(),
  ]);
}

export async function clearLoginAttempts(email: string): Promise<void> {
  await query(`DELETE FROM login_attempts WHERE email = ?`, [email.toLowerCase().trim()]);
}

export async function findUserById(id: string) {
  const rows = await query<{ id: string; email: string; password_hash: string; name: string }[]>(
    `SELECT id, email, password_hash, name FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateUserProfile(userId: string, name: string, email: string) {
  await query(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [
    name.trim(),
    email.toLowerCase().trim(),
    userId,
  ]);
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
}

export async function deleteUserAccount(userId: string) {
  await query(`DELETE FROM users WHERE id = ?`, [userId]);
}
