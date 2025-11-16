import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import ProductApprovalsAdmin from "@/components/admin/ProductApprovalsAdmin";
import SuspensionsAdmin from "@/components/admin/SuspensionsAdmin";
import FeedbackAdmin from "@/components/admin/FeedbackAdmin";
import SettingsAdmin from "@/components/admin/SettingsAdmin";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
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
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="approvals">Product Approvals</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesAdmin />
          </TabsContent>

          <TabsContent value="approvals">
            <ProductApprovalsAdmin />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersAdmin />
          </TabsContent>

          <TabsContent value="suspensions">
            <SuspensionsAdmin />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackAdmin />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;