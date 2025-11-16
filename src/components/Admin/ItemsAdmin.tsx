import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

const ItemsAdmin = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    id: "", productId: "", name: "", description: "", price: "", minimumQuantity: "1",
    imageUrl: "", videoUrl: "", additionalDetails: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: itms } = await supabase.from("items").select("*, products(name)").order("created_at", { ascending: false });
    const { data: prods } = await supabase.from("products").select("*").order("name");
    setItems(itms || []);
    setProducts(prods || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `items/${Math.random()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-media").upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-media").getPublicUrl(filePath);
      setFormData({ ...formData, [type === "image" ? "imageUrl" : "videoUrl"]: publicUrl });
      toast({ title: `${type} uploaded` });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        product_id: formData.productId, name: formData.name, description: formData.description,
        price: parseFloat(formData.price), minimum_quantity: parseInt(formData.minimumQuantity),
        image_url: formData.imageUrl, video_url: formData.videoUrl,
        additional_details: formData.additionalDetails ? JSON.parse(formData.additionalDetails) : null
      };
      if (isEditing) {
        await supabase.from("items").update(data).eq("id", formData.id);
        toast({ title: "Item updated" });
      } else {
        await supabase.from("items").insert(data);
        toast({ title: "Item created" });
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id, productId: item.product_id, name: item.name, description: item.description || "",
      price: item.price, minimumQuantity: item.minimum_quantity.toString(),
      imageUrl: item.image_url || "", videoUrl: item.video_url || "",
      additionalDetails: item.additional_details ? JSON.stringify(item.additional_details, null, 2) : ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("items").delete().eq("id", id);
    toast({ title: "Item deleted" });
    fetchData();
  };

  const resetForm = () => {
    setFormData({ id: "", productId: "", name: "", description: "", price: "", minimumQuantity: "1", imageUrl: "", videoUrl: "", additionalDetails: "" });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit" : "Add"} Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Product *</Label>
            <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })} required>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div><Label>Price (৳) *</Label><Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
          <div><Label>Minimum Quantity *</Label><Input type="number" min="1" value={formData.minimumQuantity} onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })} required /></div>
          <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={uploading} />
            {formData.imageUrl && <img src={formData.imageUrl} className="mt-2 w-32 h-32 object-cover" />}
          </div>
          <div><Label>Video</Label><Input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} disabled={uploading} /></div>
          <div><Label>Additional Details (JSON)</Label><Textarea value={formData.additionalDetails} onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>{isEditing ? "Update" : "Create"}</Button>
            {isEditing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Items</h2>
        {items.map((item: any) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between">
              <div className="flex gap-4">
                {item.image_url && <img src={item.image_url} className="w-20 h-20 object-cover" />}
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">৳{item.price} | Min: {item.minimum_quantity}</p>
                  <p className="text-xs text-muted-foreground">Product: {item.products?.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ItemsAdmin;