import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';

interface Item {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  in_stock: boolean;
  minimum_quantity: number;
  product_id: string;
}

const Product = () => {
  const { section, categoryId, productId } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['items', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('product_id', productId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (itemId: string, delta: number, minQty: number) => {
    setQuantities(prev => {
      const current = prev[itemId] || minQty;
      const newQty = Math.max(minQty, current + delta);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = (item: Item) => {
    const quantity = quantities[item.id] || item.minimum_quantity;
    addItem({
      itemId: item.id,
      name: `${product?.name} - ${item.name}`,
      price: item.price,
      quantity,
      imageUrl: item.image_url,
      minimumQuantity: item.minimum_quantity,
    });
    toast({
      title: 'Success',
      description: 'Added to cart!',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={`/${section}/category/${categoryId}`}>
        <Button variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{product?.name}</h1>
        {product?.description && (
          <p className="text-muted-foreground">{product.description}</p>
        )}
      </div>

      {product?.image_url && (
        <div className="mb-8 max-w-2xl">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full rounded-lg border border-border"
          />
        </div>
      )}

      {product?.video_url && (
        <div className="mb-8 max-w-2xl aspect-video">
          <video
            src={product.video_url}
            controls
            className="w-full rounded-lg border border-border"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">Available Items</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map(item => (
          <Card key={item.id} className={!item.in_stock ? 'opacity-50' : ''}>
            {item.image_url && (
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>৳{item.price.toFixed(2)}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              )}
              
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Min. Quantity: {item.minimum_quantity}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(item.id, -1, item.minimum_quantity)}
                    disabled={!item.in_stock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 text-center">
                    {quantities[item.id] || item.minimum_quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(item.id, 1, item.minimum_quantity)}
                    disabled={!item.in_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleAddToCart(item)}
                disabled={!item.in_stock}
              >
                {item.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {items?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No items available for this product yet.
        </div>
      )}
    </div>
  );
};

export default Product;
