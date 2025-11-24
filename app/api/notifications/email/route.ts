import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a basic structure for email notifications
// You'll need to implement your email service (Resend, SendGrid, etc.)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id, from_user_id, data } = body;

    // Verify request (add proper authentication)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications')
      .eq('id', user_id)
      .single();

    // Check if user has email notifications enabled for this type
    const emailPrefs = profile?.email_notifications || {};
    if (emailPrefs[type] === false) {
      return NextResponse.json({ message: 'Email notifications disabled for this type' });
    }

    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(user_id);
    if (!user?.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // Get sender info if needed
    let senderInfo = null;
    if (from_user_id) {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', from_user_id)
        .single();
      senderInfo = senderProfile;
    }

    // Send email based on type
    // TODO: Implement actual email sending using your email service
    // Example:
    // await sendEmail({
    //   to: user.user.email,
    //   subject: getEmailSubject(type, senderInfo),
    //   html: getEmailTemplate(type, senderInfo, data),
    // });

    console.log('Email notification:', {
      type,
      to: user.user.email,
      from: senderInfo?.display_name,
      data,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper functions for email templates
function getEmailSubject(type: string, senderInfo: any): string {
  const senderName = senderInfo?.display_name || 'Someone';
  
  switch (type) {
    case 'friend_request':
      return `${senderName} sent you a friend request`;
    case 'friend_accepted':
      return `${senderName} accepted your friend request`;
    case 'message':
      return `New message from ${senderName}`;
    case 'comment':
      return `${senderName} commented on your post`;
    case 'like':
      return `${senderName} liked your post`;
    case 'mention':
      return `${senderName} mentioned you`;
    case 'group_join_accepted':
      return `You've been accepted to join a group`;
    default:
      return 'New notification from Gastbook';
  }
}

function getEmailTemplate(type: string, senderInfo: any, data: any): string {
  // TODO: Implement proper HTML email templates
  // You can use React Email or plain HTML
  return `
    <html>
      <body>
        <h1>Gastbook Notification</h1>
        <p>You have a new ${type} notification.</p>
      </body>
    </html>
  `;
}

