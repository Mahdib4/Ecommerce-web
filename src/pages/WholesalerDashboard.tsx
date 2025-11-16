import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WholesalerProfile from "@/components/wholesaler/WholesalerProfile";
import WholesalerProducts from "@/components/wholesaler/WholesalerProducts";
import WholesalerOrders from "@/components/wholesaler/WholesalerOrders";

const WholesalerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWholesaler();
  }, []);

  const checkWholesaler = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "wholesaler")
      .single();

    if (!data) {
      navigate("/");
      return;
    }

    setLoading(false);
  };

  if (loading) {
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
        <h1 className="text-4xl font-bold mb-8">Wholesaler Dashboard</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">My Shop</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <WholesalerProfile />
          </TabsContent>

          <TabsContent value="products">
            <WholesalerProducts />
          </TabsContent>

          <TabsContent value="orders">
            <WholesalerOrders />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WholesalerDashboard;
