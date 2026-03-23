import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Fetch user by username only to avoid errors if auth_provider column is missing
    const [rows]: any = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Support both plaintext (from seed data) and bcrypt hashed passwords
    let isValid = false;
    if (user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'))) {
      isValid = await comparePassword(password, user.password_hash);
    } else {
      isValid = password === user.password_hash;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = await signJWT({
      id: Number(user.id),
      username: user.username,
      role: user.role,
      email: user.email,
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: { id: Number(user.id), username: user.username, role: user.role, email: user.email }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
