import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY c.sort_order ASC, m.name ASC
    `);
    const formattedRows = rows.map((row: any) => ({
      ...row,
      id: Number(row.id),
      category_id: Number(row.category_id)
    }));
    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category_id, name, description, price, image_url, is_available } = await request.json();

    if (!category_id || !name || price === undefined) {
      return NextResponse.json({ error: 'Category ID, name, and price are required' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      'INSERT INTO menu_items (category_id, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, image_url || null, is_available !== undefined ? is_available : true]
    );

    return NextResponse.json({ 
      id: Number(result.insertId), 
      category_id: Number(category_id), 
      name, 
      description, 
      price, 
      image_url, 
      is_available 
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
