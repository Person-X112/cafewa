import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { signJWT } from '@/lib/auth';

// POST /api/auth/google
// Simulated Google OAuth login/register
// In production, you'd verify the Google ID token here
export async function POST(request: Request) {
  try {
    const { google_id, email, display_name } = await request.json();

    if (!google_id || !email) {
      return NextResponse.json(
        { error: 'google_id and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists with this google_id
    const [existingRows]: any = await db.query(
      'SELECT * FROM users WHERE google_id = ?',
      [google_id]
    );

    let user;

    if (existingRows.length > 0) {
      // Existing Google user — just log them in
      user = existingRows[0];
    } else {
      // Check if email already taken by a local user
      const [emailRows]: any = await db.query(
        'SELECT * FROM users WHERE email = ? AND auth_provider = ?',
        [email, 'local']
      );

      if (emailRows.length > 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please login with username/password.' },
          { status: 409 }
        );
      }

      // Create new Google user
      // Use email prefix as username, append random suffix if taken
      let username = email.split('@')[0];
      const [usernameRows]: any = await db.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      if (usernameRows.length > 0) {
        username = `${username}_${Date.now().toString(36)}`;
      }

      const [result]: any = await db.query(
        'INSERT INTO users (username, email, display_name, google_id, auth_provider, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, display_name || username, google_id, 'google', 'client']
      );

      user = {
        id: Number(result.meta.last_row_id),
        username,
        email,
        display_name: display_name || username,
        role: 'client',
        auth_provider: 'google',
      };
    }

    // Generate JWT
    const token = await signJWT({
      id: Number(user.id),
      username: user.username,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        username: user.username,
        role: user.role,
        email: user.email,
        display_name: user.display_name,
      },
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
