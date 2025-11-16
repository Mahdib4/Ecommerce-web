import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 characters"),
  customerAddress: z.string().min(10, "Address must be at least 10 characters"),
  businessName: z.string().optional(),
  bkashTransactionId: z.string().min(5, "Transaction ID is required"),
});

const Checkout = () => {
  const { items, getTotalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bkashNumber, setBkashNumber] = useState("01XXXXXXXXX");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    businessName: "",
    bkashTransactionId: "",
  });

  const totalAmount = getTotalAmount();
  const advanceAmount = totalAmount * 0.05;

  useEffect(() => {
    fetchBkashNumber();
  }, []);

  const fetchBkashNumber = async () => {
    const { data, error } = await supabase.rpc('get_bkash_number');
    
    if (data && !error) {
      setBkashNumber(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = checkoutSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to place an order",
        });
        navigate("/auth");
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: validatedData.customerName,
          customer_email: validatedData.customerEmail,
          customer_phone: validatedData.customerPhone,
          customer_address: validatedData.customerAddress,
          business_name: validatedData.businessName || null,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          bkash_transaction_id: validatedData.bkashTransactionId,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_id: item.itemId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email notification
      await supabase.functions.invoke("send-order-email", {
        body: {
          orderId: order.id,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          customerAddress: validatedData.customerAddress,
          businessName: validatedData.businessName,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          totalAmount,
          advanceAmount,
          bkashTransactionId: validatedData.bkashTransactionId,
        },
      });

      clearCart();
      toast({
        title: "Order placed!",
        description: "Your order has been submitted successfully. Check your email for confirmation.",
      });
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to place order",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 lg:py-12">
        <h1 className="text-2xl lg:text-4xl font-bold mb-6 lg:mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div className="border border-border p-4 lg:p-6">
                <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Customer Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerAddress">Delivery Address *</Label>
                    <Textarea
                      id="customerAddress"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                      required
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-border p-4 lg:p-6">
                <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Payment Information</h2>
                
                <div className="bg-muted p-4 mb-4 lg:mb-6 rounded">
                  <p className="text-sm mb-2">To confirm your order, please pay 5% advance via bKash:</p>
                  <p className="text-xl lg:text-2xl font-bold">৳{advanceAmount.toFixed(2)}</p>
                  <p className="text-sm mt-2">bKash Number: <span className="font-bold text-base">{bkashNumber}</span></p>
                </div>

                <div>
                  <Label htmlFor="bkashTransactionId">bKash Transaction ID *</Label>
                  <Input
                    id="bkashTransactionId"
                    value={formData.bkashTransactionId}
                    onChange={(e) => setFormData({...formData, bkashTransactionId: e.target.value})}
                    placeholder="Enter your bKash transaction ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    After payment, enter the transaction ID you received from bKash
                  </p>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={loading} className="w-full h-12">
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="border border-border p-4 lg:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Advance (5%)</span>
                  <span>৳{advanceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>৳{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;