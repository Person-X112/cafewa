import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'idToken is required' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const { sub: google_id, email, name: display_name } = payload;

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
        username = `${username}_${Math.random().toString(36).substring(2, 7)}`;
      }

      const [result]: any = await db.query(
        'INSERT INTO users (username, email, display_name, google_id, auth_provider, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, display_name || username, google_id, 'google', 'client']
      );

      // result.meta.last_row_id for D1, might vary depending on how db.query is wrapped
      const userId = result.meta?.last_row_id || result.insertId;

      user = {
        id: Number(userId),
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
