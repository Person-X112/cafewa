import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows]: any = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const item = rows[0];
    item.id = Number(item.id);
    item.category_id = Number(item.category_id);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const user: any = token ? await verifyJWT(token) : null;
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { category_id, name, description, price, image_url, is_available, surcharge_large, surcharge_extra_large } = await request.json();

    await pool.query(
      'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ?, surcharge_large = ?, surcharge_extra_large = ? WHERE id = ?',
      [category_id, name, description, price, image_url, is_available, surcharge_large || 0, surcharge_extra_large || 0, id]
    );

    return NextResponse.json({ id: Number(id), category_id, name, description, price, image_url, is_available, surcharge_large, surcharge_extra_large });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const user: any = token ? await verifyJWT(token) : null;
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
