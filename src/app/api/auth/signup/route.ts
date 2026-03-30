import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, email, password, confirmPassword } = await request.json();

    // 1. Basic validation
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // 2. Password complexity validation (6+ chars, uppercase, lowercase, number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' 
      }, { status: 400 });
    }

    // 3. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 4. Check if user already exists
    const [existingUsers]: any = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    // 5. Hash password and insert user
    const passwordHash = await hashPassword(password);
    
    await db.query(
      'INSERT INTO users (username, email, password_hash, role, auth_provider) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, 'client', 'local']
    );

    // 6. Fetch the newly created user to get the ID
    const [newUsers]: any = await db.query(
      'SELECT id, username, role, email FROM users WHERE username = ?',
      [username]
    );
    const user = newUsers[0];

    // 7. Generate JWT for auto-login after signup
    const token = await signJWT({
      id: Number(user.id),
      username: user.username,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: { id: Number(user.id), username: user.username, role: user.role, email: user.email }
    });

    // 8. Set session cookie
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
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
