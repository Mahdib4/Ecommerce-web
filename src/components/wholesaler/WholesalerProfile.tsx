import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const WholesalerProfile = () => {
  const [profile, setProfile] = useState({
    shop_name: "",
    shop_description: "",
    shop_logo_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        shop_name: data.shop_name || "",
        shop_description: data.shop_description || "",
        shop_logo_url: data.shop_logo_url || "",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-media")
        .getPublicUrl(filePath);

      setProfile({ ...profile, shop_logo_url: publicUrl });
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          shop_name: profile.shop_name,
          shop_description: profile.shop_description,
          shop_logo_url: profile.shop_logo_url,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Shop profile updated successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Shop Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="shop_name">Shop Name *</Label>
          <Input
            id="shop_name"
            value={profile.shop_name}
            onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="shop_description">Shop Description</Label>
          <Textarea
            id="shop_description"
            value={profile.shop_description}
            onChange={(e) => setProfile({ ...profile, shop_description: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="logo">Shop Logo</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploading}
          />
          {profile.shop_logo_url && (
            <img src={profile.shop_logo_url} alt="Shop logo" className="mt-2 w-32 h-32 object-cover rounded" />
          )}
        </div>

        <Button type="submit" disabled={uploading}>
          Update Shop Profile
        </Button>
      </form>
    </Card>
  );
};

export default WholesalerProfile;
