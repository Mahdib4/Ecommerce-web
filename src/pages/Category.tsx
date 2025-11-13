import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Category = () => {
  const { section, categoryId } = useParams<{ section: string; categoryId: string }>();

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={`/${section}`}>
        <Button variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Button>
      </Link>

      <h1 className="text-4xl font-bold mb-2">{category?.name}</h1>
      {category?.description && (
        <p className="text-muted-foreground mb-8">{category.description}</p>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {products?.map(product => (
          <Link key={product.id} to={`/${section}/category/${categoryId}/product/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              {product.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              {product.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No products available in this category yet.
        </div>
      )}
    </div>
  );
};

export default Category;
