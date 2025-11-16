import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item_id: string;
  items: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  business_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

const WholesalerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all items belonging to this wholesaler
      const { data: wholesalerItems } = await supabase
        .from("items")
        .select("id")
        .eq("wholesaler_id", user.id);

      if (!wholesalerItems || wholesalerItems.length === 0) {
        setLoading(false);
        return;
      }

      const itemIds = wholesalerItems.map(item => item.id);

      // Get all order_items that reference these items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id")
        .in("item_id", itemIds);

      if (!orderItems || orderItems.length === 0) {
        setLoading(false);
        return;
      }

      const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];

      // Get full order details
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (!ordersData) {
        setLoading(false);
        return;
      }

      // For each order, get only the order_items that belong to this wholesaler
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from("order_items")
            .select("*, items(name, image_url)")
            .eq("order_id", order.id)
            .in("item_id", itemIds);

          return {
            ...order,
            order_items: items || []
          };
        })
      );

      setOrders(ordersWithItems as any);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-500";
      case "processing": return "bg-blue-500/20 text-blue-500";
      case "completed": return "bg-green-500/20 text-green-500";
      case "cancelled": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No orders yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold">Customer Details</p>
              <p className="text-sm">{order.customer_name}</p>
              {order.business_name && (
                <p className="text-sm text-muted-foreground">{order.business_name}</p>
              )}
              <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{order.customer_address}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="flex items-center gap-2">
                    {item.items.image_url && (
                      <img 
                        src={item.items.image_url} 
                        alt={item.items.name} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <span>{item.items.name}</span>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>৳{parseFloat(item.price as any).toFixed(2)}</TableCell>
                  <TableCell>৳{(parseFloat(item.price as any) * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
};

export default WholesalerOrders;
