import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import ImageGallery from "@/components/ImageGallery";

const ItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [wholesalerId, setWholesalerId] = useState<string | null>(null);

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    const { data } = await supabase
      .from("items")
      .select("*, product:products(wholesaler_id)")
      .eq("id", itemId)
      .single();

    if (data) {
      const wholesaler_id = data.product?.wholesaler_id;
      setWholesalerId(wholesaler_id || null);
      
      if (wholesaler_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("shop_name")
          .eq("user_id", wholesaler_id)
          .single();
        
        setItem({ ...data, wholesaler_profile: profileData });
      } else {
        setItem(data);
      }
      
      setQuantity(data.minimum_quantity);
    }
  };

  const handleContactWholesaler = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!wholesalerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wholesaler information not available"
      });
      return;
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", user.id)
      .eq("wholesaler_id", wholesalerId)
      .single();

    if (existingConv) {
      navigate(`/chat/${existingConv.id}`);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: user.id,
        wholesaler_id: wholesalerId
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start conversation"
      });
      return;
    }

    navigate(`/chat/${newConv.id}`);
  };

  const handleAddToCart = () => {
    if (quantity < item.minimum_quantity) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: `Minimum order quantity is ${item.minimum_quantity} units`,
      });
      return;
    }

    addItem({
      id: item.id,
      itemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity,
      minimumQuantity: item.minimum_quantity,
      imageUrl: item.image_url,
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });

    navigate("/cart");
  };

  if (!item) {
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
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-4">
            <ImageGallery 
              images={item.images && Array.isArray(item.images) ? item.images : (item.image_url ? [item.image_url] : [])} 
              name={item.name} 
            />
            {item.video_url && (
              <div className="aspect-video bg-muted">
                <video
                  src={item.video_url}
                  controls
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
              {item.wholesaler_profile?.shop_name && (
                <p className="text-sm text-muted-foreground mb-2">
                  Sold by: <span className="font-semibold">{item.wholesaler_profile.shop_name}</span>
                </p>
              )}
              {item.description && (
                <p className="text-xl text-muted-foreground">{item.description}</p>
              )}
            </div>

            <div className="border-t border-b border-border py-6 space-y-2">
              <p className="text-4xl font-bold">৳{parseFloat(item.price).toFixed(2)}</p>
              <p className="text-muted-foreground">
                Minimum order quantity: {item.minimum_quantity} units
              </p>
            </div>

            {item.additional_details && (
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Additional Details</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {typeof item.additional_details === 'string' 
                    ? item.additional_details 
                    : JSON.stringify(item.additional_details, null, 2)}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={item.minimum_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || item.minimum_quantity)}
                  className="max-w-xs"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAddToCart} size="lg" className="flex-1">
                  Add to Cart
                </Button>
                {wholesalerId && (
                  <Button onClick={handleContactWholesaler} size="lg" variant="outline" className="flex-1">
                    Contact Wholesaler
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemPage;