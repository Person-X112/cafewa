import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.length === 0) {
    throw new Error('CRITICAL: JWT_SECRET_KEY is not defined in environment variables. Access to local accounts is disabled to prevent lockout confusion.');
  }
  return secret;
};

export const verifyJWT = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload;
  } catch (err) {
    return null;
  }
};

export const signJWT = async (payload: { id: number; username: string; role: string; email?: string }) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(getJwtSecretKey()));
};

export const hashPassword = async (password: string) => {
  // Using SHA-256 for hashing as requested
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
};

export const comparePassword = async (password: string, hash: string) => {
  if (hash.startsWith('sha256:')) {
    const newHash = await hashPassword(password);
    return newHash === hash;
  }
  // Fallback to bcrypt for existing users
  return await bcrypt.compare(password, hash);
};
