import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query) searchItems();
  }, [query]);

  const searchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*, products(name, categories(name))")
      .ilike("name", `%${query}%`);
    
    if (data && data.length > 0) {
      // Fetch wholesaler profiles
      const wholesalerIds = data.filter(item => item.wholesaler_id).map(item => item.wholesaler_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, shop_name")
        .in("user_id", wholesalerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const itemsWithProfiles = data.map(item => ({
        ...item,
        wholesaler_profile: item.wholesaler_id ? profileMap.get(item.wholesaler_id) : null
      }));

      setResults(itemsWithProfiles);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Search Results for "{query}"</h1>
        {results.length === 0 ? (
          <p className="text-muted-foreground">No results found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {results.map((item) => (
              <Link key={item.id} to={`/item/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image_url && <div className="aspect-video bg-muted"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /></div>}
                  <div className="p-6">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-muted-foreground text-sm">{item.products?.name}</p>
                    {(item as any).wholesaler_profile?.shop_name && (
                      <p className="text-xs text-muted-foreground">by {(item as any).wholesaler_profile.shop_name}</p>
                    )}
                    <p className="text-xl font-bold mt-2">৳{parseFloat(item.price).toFixed(2)}</p>
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

export default Search;