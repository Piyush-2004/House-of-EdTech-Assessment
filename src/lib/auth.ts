import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Password verification
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// JWT generation
export async function signJWT(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

// JWT verification
export async function verifyJWT(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

// Get user session from cookies
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyJWT(token);
  } catch (error) {
    return null;
  }
}

// Get user session from NextRequest (useful in middleware/edge)
export async function getSessionFromRequest(req: NextRequest): Promise<UserSession | null> {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    return verifyJWT(token);
  } catch (error) {
    return null;
  }
}
