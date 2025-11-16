import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    advanceAmount: '',
    transactionId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const advanceAmount = parseFloat(formData.advanceAmount);
      
      if (advanceAmount < totalAmount * 0.3) {
        toast({
          title: 'Error',
          description: 'Advance payment must be at least 30% of total amount',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_address: formData.address,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          transaction_id: formData.transactionId,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        item_id: item.itemId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email notification
      await supabase.functions.invoke('send-order-email', {
        body: {
          orderId: order.id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          totalAmount,
          advanceAmount,
          transactionId: formData.transactionId,
        },
      });

      clearCart();
      toast({
        title: 'Success',
        description: 'Order placed successfully!',
      });
      navigate('/order-success');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Textarea
                    id="address"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold mb-4">Payment Information</h3>
                  
                  <div>
                    <Label htmlFor="advanceAmount">Advance Payment (Min. 30%) *</Label>
                    <Input
                      id="advanceAmount"
                      type="number"
                      step="0.01"
                      required
                      value={formData.advanceAmount}
                      onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })}
                      placeholder={`Minimum: ৳${(totalAmount * 0.3).toFixed(2)}`}
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="transactionId">Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      required
                      value={formData.transactionId}
                      onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="Enter your bKash/Nagad transaction ID"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between text-lg font-semibold border-t pt-4">
                <span>Total</span>
                <span>৳{totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>* Minimum 30% advance payment required</p>
                <p>* Remaining balance to be paid on delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
