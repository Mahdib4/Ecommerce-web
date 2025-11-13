import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderEmailRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  advanceAmount: number;
  transactionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    
    console.log('Sending order email with data:', data);

    // Create SMTP client for Gmail
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get('GMAIL_USER') as string,
          password: Deno.env.get('GMAIL_APP_PASSWORD') as string,
        },
      },
    });

    // Build items list HTML
    const itemsList = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">৳${item.price.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">৳${(item.quantity * item.price).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #000; color: #fff; padding: 10px; text-align: left; }
            td { padding: 10px; border: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Wholesale Order</h1>
            </div>
            <div class="content">
              <div class="section">
                <h2>Customer Information</h2>
                <p><span class="label">Name:</span> ${data.customerName}</p>
                <p><span class="label">Email:</span> ${data.customerEmail}</p>
                <p><span class="label">Phone:</span> ${data.customerPhone}</p>
                <p><span class="label">Address:</span> ${data.customerAddress}</p>
              </div>

              <div class="section">
                <h2>Order Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>
              </div>

              <div class="section">
                <p class="total">Total Amount: ৳${data.totalAmount.toFixed(2)}</p>
                <p class="total">Advance Payment (5%): ৳${data.advanceAmount.toFixed(2)}</p>
                <p><span class="label">bKash Transaction ID:</span> ${data.transactionId}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await client.send({
      from: Deno.env.get('GMAIL_USER') as string,
      to: Deno.env.get('GMAIL_USER') as string,
      subject: `New Order from ${data.customerName}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
