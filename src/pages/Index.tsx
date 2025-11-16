import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  source: "local" | "chinese";
}

const Index = () => {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [chineseCategories, setChineseCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data: local } = await supabase
      .from("categories")
      .select("*")
      .eq("source", "local")
      .order("created_at", { ascending: false });

    const { data: chinese } = await supabase
      .from("categories")
      .select("*")
      .eq("source", "chinese")
      .order("created_at", { ascending: false });

    setLocalCategories(local || []);
    setChineseCategories(chinese || []);
  };

  const CategorySection = ({ title, categories }: { title: string; categories: Category[] }) => (
    <section className="py-16">
      <h2 className="text-4xl font-bold mb-12 text-center">{title}</h2>
      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">No categories available yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.id} to={`/category/${category.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {category.image_url && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground">{category.description}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4">
        <div className="py-24 text-center border-b border-border">
          <h1 className="text-6xl font-bold mb-4">WHOLESALE MARKETPLACE</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Premium products at wholesale prices for your business
          </p>
        </div>

        <CategorySection title="Local Products" categories={localCategories} />
        
        <div className="border-t border-border"></div>
        
        <CategorySection title="Chinese Products" categories={chineseCategories} />
      </main>

      <footer className="border-t border-border mt-24 py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Wholesale. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;