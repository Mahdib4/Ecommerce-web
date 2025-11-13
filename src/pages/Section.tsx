import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Section = () => {
  const { section } = useParams<{ section: string }>();
  const sectionType = section === 'local' ? 'local' : 'chinese';

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', sectionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('section', sectionType)
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
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 capitalize">{sectionType} Products</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {categories?.map(category => (
          <Link key={category.id} to={`/${sectionType}/category/${category.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              {category.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No categories available yet.
        </div>
      )}
    </div>
  );
};

export default Section;
