import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    let user: any = null;
    
    if (token) {
      user = await verifyJWT(token);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = 'SELECT * FROM orders';
    let params: any[] = [];

    if (user.role !== 'admin') {
      query += ' WHERE user_id = ?';
      params.push(Number(user.id));
    }

    query += ' ORDER BY created_at DESC';

    const [orders]: any = await pool.query(query, params);

    // Fetch order items for each order
    for (let order of orders) {
      order.id = Number(order.id);
      const [items]: any = await pool.query(`
        SELECT oi.*, m.name as item_name, m.image_url
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const token = request.cookies.get('token')?.value;
    let user: any = null;
    
    if (token) {
      user = await verifyJWT(token);
    }

    const { items } = await request.json(); // Array of { menu_item_id, quantity }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    // Connect and start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // Check items and calculate total
    for (const item of items) {
      const [menuItemRows]: any = await connection.query(
        'SELECT price FROM menu_items WHERE id = ? AND is_available = TRUE',
        [item.menu_item_id]
      );

      if (menuItemRows.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
      }

      const price = parseFloat(menuItemRows[0].price);
      totalAmount += price * item.quantity;
      
      orderItemsToInsert.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_time: price
      });
    }

    // Generate a fake payment session ID (simulating Stripe)
    const paymentSessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const userId = user ? user.id : null;
    const [orderResult]: any = await connection.query(
      'INSERT INTO orders (user_id, status, total_amount, payment_status, payment_session_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'pending', totalAmount, 'unpaid', paymentSessionId]
    );
    const orderId = orderResult.insertId;

    for (const oi of orderItemsToInsert) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
        [orderId, oi.menu_item_id, oi.quantity, oi.price_at_time]
      );
    }

    await connection.commit();
    return NextResponse.json({
      id: Number(orderId),
      status: 'pending',
      total_amount: totalAmount,
      payment_status: 'unpaid',
      payment_session_id: paymentSessionId
    }, { status: 201 });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
