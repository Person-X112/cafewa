import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY || 'super_secret_cafe_key_for_dev';
  if (!secret || secret.length === 0) {
    throw new Error('The environment variable JWT_SECRET_KEY is not set.');
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
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
