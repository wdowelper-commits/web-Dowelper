// Supabase Edge Function: send-notification
// Sends transactional emails via Resend (https://resend.com)
// 1. Sends new order notification to shop_email
// 2. Sends confirmation email to customer (if email provided)
// 3. Sends event catering inquiry notification to shop_email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://mithassweets.vercel.app';
const DEFAULT_FROM = Deno.env.get('SENDER_EMAIL') || 'Mithas Sweets <orders@mithassweets.com>';

interface OrderEmailPayload {
  type: 'order_created';
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  total: number;
  delivery_type: string;
  delivery_address?: string;
  delivery_slot?: string;
  payment_method: string;
  items: Array<{ name: string; quantity: number; unit: string; total: number }>;
  shop_email?: string;
}

interface InquiryEmailPayload {
  type: 'inquiry_created';
  name: string;
  phone: string;
  email?: string;
  event_type: string;
  event_date: string;
  estimated_boxes: number;
  budget_range?: string;
  custom_requirements?: string;
  shop_email?: string;
}

type NotificationPayload = OrderEmailPayload | InquiryEmailPayload;

async function sendEmailViaResend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not configured in Supabase secrets. Skipping email to:', to);
    return { success: false, warning: 'RESEND_API_KEY not set' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.warn(`Resend API error (${res.status}):`, errorBody);
    return { success: false, error: errorBody };
  }

  const data = await res.json();
  return { success: true, id: data.id };
}

serve(async (req: Request) => {
  // CORS support
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (payload.type === 'order_created') {
      const shopOwnerEmail = payload.shop_email || 'orders@mithassweets.com';
      const trackingUrl = `${SITE_URL}/#track-${payload.order_number}`;

      const itemsHtml = payload.items
        .map(
          (it) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${it.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${it.quantity} ${it.unit}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${it.total.toLocaleString()}</td>
          </tr>`
        )
        .join('');

      // 1. Email to Shop Owner
      const shopEmailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2A170A;">
          <h2 style="color: #C2410C; margin-bottom: 4px;">New Order Received: ${payload.order_number}</h2>
          <p style="color: #666; font-size: 14px;">A new sweet order has been placed on Mithas Sweets storefront.</p>
          
          <div style="background: #FFF8EE; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #F0DCC4;">
            <p><strong>Customer Name:</strong> ${payload.customer_name}</p>
            <p><strong>Phone:</strong> ${payload.customer_phone}</p>
            ${payload.customer_email ? `<p><strong>Email:</strong> ${payload.customer_email}</p>` : ''}
            <p><strong>Fulfillment:</strong> ${payload.delivery_type.toUpperCase()}</p>
            ${payload.delivery_slot ? `<p><strong>Slot:</strong> ${payload.delivery_slot}</p>` : ''}
            ${payload.delivery_address ? `<p><strong>Address:</strong> ${payload.delivery_address}</p>` : ''}
            <p><strong>Payment Method:</strong> ${payload.payment_method.toUpperCase()}</p>
            <p><strong>Total Amount:</strong> <span style="font-size: 18px; color: #C2410C; font-weight: bold;">Rs. ${payload.total.toLocaleString()}</span></p>
          </div>

          <h3>Ordered Items:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f7f7f7;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      `;

      await sendEmailViaResend(
        shopOwnerEmail,
        `New Order Received: ${payload.order_number}`,
        shopEmailHtml
      );

      // 2. Email to Customer (if email provided)
      if (payload.customer_email && payload.customer_email.includes('@')) {
        const customerEmailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2A170A; line-height: 1.6;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #C2410C; margin: 0; font-size: 28px;">Mithas Sweets</h1>
              <p style="color: #8C4A1A; margin: 4px 0 0; font-size: 14px;">Fresh Traditional Sweets & Confections</p>
            </div>

            <div style="background: #FFF8EE; padding: 24px; border-radius: 16px; border: 1px solid #F0DCC4;">
              <h2 style="color: #2A170A; margin-top: 0;">Order Confirmed! 🎉</h2>
              <p>Dear ${payload.customer_name},</p>
              <p>Thank you for choosing Mithas Sweets. Your sweet order <strong>${payload.order_number}</strong> has been received and is being prepared fresh in pure desi ghee.</p>
              
              <div style="background: #fff; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #EAE2D5;">
                <p style="margin: 4px 0;"><strong>Order Number:</strong> ${payload.order_number}</p>
                <p style="margin: 4px 0;"><strong>Delivery Slot:</strong> ${payload.delivery_slot || 'Standard'}</p>
                <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${payload.payment_method.toUpperCase()}</p>
                <p style="margin: 4px 0;"><strong>Total Payable:</strong> <span style="font-size: 18px; color: #C2410C; font-weight: bold;">Rs. ${payload.total.toLocaleString()}</span></p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #C2410C; color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Track Your Order Online
                </a>
              </div>
              <p style="font-size: 12px; color: #888; text-align: center;">
                Or track anytime at: <a href="${trackingUrl}" style="color: #C2410C;">${trackingUrl}</a>
              </p>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              For immediate inquiries, contact us on WhatsApp: 03027628552
            </p>
          </div>
        `;

        await sendEmailViaResend(
          payload.customer_email,
          `Order Confirmed - ${payload.order_number} | Mithas Sweets`,
          customerEmailHtml
        );
      }
    } else if (payload.type === 'inquiry_created') {
      const shopOwnerEmail = payload.shop_email || 'orders@mithassweets.com';
      const inquiryHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2A170A;">
          <h2 style="color: #C2410C;">New Event Catering Inquiry Received</h2>
          <div style="background: #FFF8EE; padding: 16px; border-radius: 12px; border: 1px solid #F0DCC4;">
            <p><strong>Customer Name:</strong> ${payload.name}</p>
            <p><strong>Phone / WhatsApp:</strong> ${payload.phone}</p>
            ${payload.email ? `<p><strong>Email:</strong> ${payload.email}</p>` : ''}
            <p><strong>Event Occasion:</strong> ${payload.event_type}</p>
            <p><strong>Event Date:</strong> ${payload.event_date}</p>
            <p><strong>Estimated Boxes:</strong> ${payload.estimated_boxes}</p>
            <p><strong>Budget Range:</strong> ${payload.budget_range || 'Custom'}</p>
            ${payload.custom_requirements ? `<p><strong>Requirements:</strong> "${payload.custom_requirements}"</p>` : ''}
          </div>
        </div>
      `;

      await sendEmailViaResend(
        shopOwnerEmail,
        `New Event Catering Inquiry: ${payload.name} (${payload.event_type})`,
        inquiryHtml
      );
    }

    return new Response(JSON.stringify({ success: true, message: 'Notification processed' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.warn('send-notification function exception:', err);
    // Non-blocking response
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
