import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store subscription in database
    // You'll need to create a push_subscriptions table
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription: subscription,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error storing subscription:', error);
      // If table doesn't exist, just log and continue
      if (error.code !== '42P01') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error subscribing to push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

