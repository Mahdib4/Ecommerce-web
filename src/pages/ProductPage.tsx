import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageGallery from "@/components/ImageGallery";

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  minimum_quantity: number;
  image_url: string;
  images: any;
  video_url: string;
  additional_details: any;
}

const ProductPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    const { data: prod } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    const { data: itms } = await supabase
      .from("items")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (prod && prod.wholesaler_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("shop_name")
        .eq("user_id", prod.wholesaler_id)
        .single();
      
      setProduct({ ...prod, wholesaler_profile: profileData });
    } else {
      setProduct(prod);
    }
    
    setItems(itms || []);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="mb-8">
            <ImageGallery 
              images={product.images && Array.isArray(product.images) ? product.images : (product.image_url ? [product.image_url] : [])} 
              name={product.name} 
            />
          </div>
          <h1 className="text-5xl font-bold mb-4">{product.name}</h1>
          {product.wholesaler_profile?.shop_name && (
            <p className="text-sm text-muted-foreground mb-2">
              Sold by: <span className="font-semibold">{product.wholesaler_profile.shop_name}</span>
            </p>
          )}
          {product.description && (
            <p className="text-xl text-muted-foreground">{product.description}</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Available Items</h2>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No items available yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={(item.images && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                  )}
                  <div className="space-y-2 mb-4">
                    <p className="text-2xl font-bold">৳{item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Minimum order: {item.minimum_quantity} units
                    </p>
                  </div>
                  <Link to={`/item/${item.id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;