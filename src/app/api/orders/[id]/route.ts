import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

// GET /api/orders/[id] — get a single order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const token = request.cookies.get('token')?.value;
    let user: any = null;
    if (token) {
      user = await verifyJWT(token);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the order
    const [orderRows]: any = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRows[0];

    // Non-admin users can only see their own orders
    if (user.role !== 'admin' && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch order items
    const [items]: any = await pool.query(
      `SELECT oi.*, m.name as item_name, m.image_url
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    order.items = items;

    // Cast IDs to numbers to avoid BigInt serialization issues in NextResponse.json
    order.id = Number(order.id);
    if (order.user_id) order.user_id = Number(order.user_id);
    if (order.items) {
      order.items = order.items.map((item: any) => ({
        ...item,
        id: Number(item.id),
        order_id: Number(item.order_id),
        menu_item_id: Number(item.menu_item_id)
      }));
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] — update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const token = request.cookies.get('token')?.value;
    let user: any = null;
    if (token) {
      user = await verifyJWT(token);
    }

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    return NextResponse.json({ success: true, id: orderId, status });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
