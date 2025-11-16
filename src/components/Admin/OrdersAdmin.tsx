import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const { toast } = useToast();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*, order_items(*, items(name))").order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (orderId: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ variant: "destructive", title: "Error updating status" });
    } else {
      toast({ title: "Order status updated" });
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "secondary";
      case "confirmed": return "default";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">All Orders</h2>
      {orders.map((order: any) => (
        <Card key={order.id} className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{order.customer_name}</h3>
                <p className="text-sm text-muted-foreground">{order.customer_email} | {order.customer_phone}</p>
                {order.business_name && <p className="text-sm text-muted-foreground">Business: {order.business_name}</p>}
                <p className="text-sm text-muted-foreground mt-1">{order.customer_address}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">৳{parseFloat(order.total_amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Advance: ৳{parseFloat(order.advance_amount).toFixed(2)}</p>
                <Badge variant={getStatusColor(order.status)} className="mt-2">{order.status}</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">bKash Transaction: {order.bkash_transaction_id}</p>
              <div className="space-y-1">
                {order.order_items?.map((oi: any) => (
                  <p key={oi.id} className="text-sm text-muted-foreground">
                    {oi.items?.name} x {oi.quantity} @ ৳{parseFloat(oi.price).toFixed(2)}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as "pending" | "confirmed" | "completed" | "cancelled")}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OrdersAdmin;