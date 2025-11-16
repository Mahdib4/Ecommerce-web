import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  images: any;
  video_url: string;
}

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    const { data: cat } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .single();

    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (prods && prods.length > 0) {
      const wholesalerIds = prods.filter(p => p.wholesaler_id).map(p => p.wholesaler_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, shop_name")
        .in("user_id", wholesalerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const productsWithProfiles = prods.map(product => ({
        ...product,
        wholesaler_profile: product.wholesaler_id ? profileMap.get(product.wholesaler_id) : null
      }));

      setProducts(productsWithProfiles as any);
    } else {
      setProducts([]);
    }

    setCategory(cat);
  };

  if (!category) {
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
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-xl text-muted-foreground">{category.description}</p>
          )}
        </div>

        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products available yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-muted">
                    <img
                      src={(product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    {(product as any).wholesaler_profile?.shop_name && (
                      <p className="text-xs text-muted-foreground mb-1">
                        by {(product as any).wholesaler_profile.shop_name}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;