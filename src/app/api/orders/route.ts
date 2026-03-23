import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
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

    let queryStr = 'SELECT * FROM orders';
    let params: any[] = [];

    if (user.role !== 'admin') {
      queryStr += ' WHERE user_id = ?';
      params.push(Number(user.id));
    }

    queryStr += ' ORDER BY created_at DESC';

    const [orders]: any = await db.query(queryStr, params);

    // Fetch order items for each order
    for (let order of orders) {
      order.id = Number(order.id);
      const [items]: any = await db.query(`
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

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // Check items and calculate total - sequential SELECTs are okay here before the batch
    for (const item of items) {
      const [menuItemRows]: any = await db.query(
        'SELECT price, surcharge_large, surcharge_extra_large FROM menu_items WHERE id = ? AND is_available = 1',
        [item.menu_item_id]
      );

      if (menuItemRows.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
      }

      const basePrice = parseFloat(menuItemRows[0].price);
      let finalPrice = basePrice;
      
      const customization = item.customization ? JSON.parse(item.customization) : null;
      if (customization && customization.options) {
        if (customization.options.size === 'Large') {
          finalPrice += parseFloat(menuItemRows[0].surcharge_large || 0);
        } else if (customization.options.size === 'Extra Large') {
          finalPrice += parseFloat(menuItemRows[0].surcharge_extra_large || 0);
        }
      }

      totalAmount += finalPrice * item.quantity;
      
      orderItemsToInsert.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_time: finalPrice,
        customization: item.customization || null
      });
    }

    // Generate a fake payment session ID (simulating Stripe)
    const paymentSessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userId = user ? user.id : null;

    // In D1, for transactions that need the ID of the first insert, 
    // we can use a sequence or run them in a way that captures the ID.
    // Batching doesn't easily allow using the result of one stmt in another within the same batch.
    // However, SQLite/D1 batch is atomic. 
    // Since we need orderId for order_items, we'll run the order insert first, 
    // then batch the items. (D1 single run is atomic, and we can't easily batch with dependency).
    
    const [orderResult]: any = await db.query(
      'INSERT INTO orders (user_id, status, total_amount, payment_status, payment_session_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'pending', totalAmount, 'unpaid', paymentSessionId]
    );
    const orderId = orderResult.meta.last_row_id;

    // Now batch the order items
    const itemStatements = orderItemsToInsert.map(oi => 
      db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time, customization) VALUES (?, ?, ?, ?, ?)')
        .bind(orderId, oi.menu_item_id, oi.quantity, oi.price_at_time, oi.customization)
    );

    if (itemStatements.length > 0) {
      await db.batch(itemStatements);
    }

    return NextResponse.json({
      id: Number(orderId),
      status: 'pending',
      total_amount: totalAmount,
      payment_status: 'unpaid',
      payment_session_id: paymentSessionId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
