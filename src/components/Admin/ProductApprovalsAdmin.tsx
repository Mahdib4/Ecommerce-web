import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  video_url: string;
  status: string;
  wholesaler_id: string;
  category_id: string;
  categories: {
    name: string;
  };
  profiles: {
    shop_name: string;
    full_name: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    minimum_quantity: number;
  }[];
}

const ProductApprovalsAdmin = () => {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        items(id, name, price, minimum_quantity)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch pending products");
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch wholesaler profiles separately
    if (products && products.length > 0) {
      const wholesalerIds = [...new Set(products.map(p => p.wholesaler_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, shop_name, full_name")
        .in("user_id", wholesalerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const productsWithProfiles = products.map(product => ({
        ...product,
        profiles: profileMap.get(product.wholesaler_id!) || { shop_name: "", full_name: "" }
      }));

      setPendingProducts(productsWithProfiles as any);
    } else {
      setPendingProducts([]);
    }
    
    setLoading(false);
  };

  const updateProductStatus = async (productId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", productId);

    if (error) {
      toast.error(`Failed to ${status} product`);
      console.error(error);
    } else {
      toast.success(`Product ${status} successfully`);
      fetchPendingProducts();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pending Product Approvals</h2>
      
      {pendingProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending products to review
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {product.profiles?.shop_name || product.profiles?.full_name}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">{product.categories?.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>

                {product.items && product.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Items</p>
                    <div className="space-y-2">
                      {product.items.map((item) => (
                        <div key={item.id} className="text-sm bg-muted/50 p-2 rounded">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">
                            Price: ৳{item.price} | Min Qty: {item.minimum_quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => updateProductStatus(product.id, "approved")}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateProductStatus(product.id, "rejected")}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductApprovalsAdmin;
