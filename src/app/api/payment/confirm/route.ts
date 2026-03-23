import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

// POST /api/payment/confirm
// Simulates Stripe payment confirmation
// In production, this would be a Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    let user: any = null;
    if (token) {
      user = await verifyJWT(token);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, payment_session_id } = await request.json();

    if (!order_id || !payment_session_id) {
      return NextResponse.json(
        { error: 'order_id and payment_session_id are required' },
        { status: 400 }
      );
    }

    // Fetch the order
    const [orderRows]: any = await db.query(
      'SELECT * FROM orders WHERE id = ? AND payment_session_id = ?',
      [order_id, payment_session_id]
    );

    if (orderRows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or invalid payment session' },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Verify user owns this order (or is admin)
    if (user.role !== 'admin' && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Mark as paid
    await db.query(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
      ['paid', 'preparing', order_id]
    );

    return NextResponse.json({
      success: true,
      order_id: Number(order_id),
      payment_status: 'paid',
      order_status: 'preparing',
    });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
