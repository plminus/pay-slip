import { db } from "./turso";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface CreateUserParams {
  email: string;
  displayName: string;
  firebaseUid: string;
  role?: "admin" | "employee";
}

/**
 * 新しいユーザーをデータベースに作成
 */
export async function createUser(params: CreateUserParams) {
  const { email, displayName, firebaseUid, role = "employee" } = params;

  try {
    const result = await db.insert(users).values({
      email,
      displayName,
      firebaseUid,
      role,
    }).returning();

    return result[0];
  } catch (error) {
    console.error("Failed to create user in database:", error);
    throw error;
  }
}

/**
 * Firebase UIDでユーザーを取得
 */
export async function getUserByFirebaseUid(firebaseUid: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user from database:", error);
    throw error;
  }
}

/**
 * メールアドレスでユーザーを取得
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user by email:", error);
    throw error;
  }
}
