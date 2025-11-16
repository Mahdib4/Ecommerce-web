import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus } from "lucide-react";

const WholesalerProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    categoryId: "",
    name: "",
    description: "",
    imageUrl: "",
    images: [] as string[],
    videoUrl: "",
    source: "local" as "local" | "chinese",
    price: "",
    minimumQuantity: "1",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prods } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("wholesaler_id", user.id)
      .order("created_at", { ascending: false });
    
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    setProducts(prods || []);
    setCategories(cats || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      if (type === "image") {
        const uploadedUrls: string[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("product-media")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("product-media")
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }

        const newImages = [...formData.images, ...uploadedUrls];
        setFormData({ ...formData, images: newImages, imageUrl: newImages[0] || "" });
        toast({ title: `${uploadedUrls.length} image(s) uploaded successfully` });
      } else {
        const file = files[0];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-media")
          .getPublicUrl(filePath);

        setFormData({ ...formData, videoUrl: publicUrl });
        toast({ title: "Video uploaded successfully" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages, imageUrl: newImages[0] || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isEditing) {
        // Update product
        const { error: prodError } = await supabase
          .from("products")
          .update({
            category_id: formData.categoryId,
            name: formData.name,
            description: formData.description,
            image_url: formData.imageUrl,
            images: formData.images,
            video_url: formData.videoUrl,
            source: formData.source,
            status: 'pending',
          })
          .eq("id", formData.id)
          .eq("wholesaler_id", user.id);

        if (prodError) throw prodError;

        // Update associated item
        const { error: itemError } = await supabase
          .from("items")
          .update({
            price: parseFloat(formData.price),
            minimum_quantity: parseInt(formData.minimumQuantity),
          })
          .eq("product_id", formData.id);

        if (itemError) throw itemError;

        toast({ title: "Product updated and sent for admin approval" });
      } else {
        // Create product
        const { data: newProduct, error: prodError } = await supabase
          .from("products")
          .insert({
            category_id: formData.categoryId,
            name: formData.name,
            description: formData.description,
            image_url: formData.imageUrl,
            images: formData.images,
            video_url: formData.videoUrl,
            source: formData.source,
            wholesaler_id: user.id,
            status: 'pending',
          })
          .select()
          .single();

        if (prodError) throw prodError;

        // Create associated item
        const { error: itemError } = await supabase
          .from("items")
          .insert({
            product_id: newProduct.id,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            minimum_quantity: parseInt(formData.minimumQuantity),
            image_url: formData.imageUrl,
            images: formData.images,
            video_url: formData.videoUrl,
            wholesaler_id: user.id,
          });

        if (itemError) throw itemError;

        toast({ title: "Product created and sent for admin approval" });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEdit = async (product: any) => {
    // Fetch the item data for this product
    const { data: item } = await supabase
      .from("items")
      .select("*")
      .eq("product_id", product.id)
      .single();

    setFormData({
      id: product.id,
      categoryId: product.category_id,
      name: product.name,
      description: product.description || "",
      imageUrl: product.image_url || "",
      images: product.images || [],
      videoUrl: product.video_url || "",
      source: product.source || "local",
      price: item?.price?.toString() || "",
      minimumQuantity: item?.minimum_quantity?.toString() || "1",
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Product deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({ 
      id: "", 
      categoryId: "", 
      name: "", 
      description: "", 
      imageUrl: "", 
      images: [],
      videoUrl: "", 
      source: "local",
      price: "",
      minimumQuantity: "1",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          <Plus className="inline mr-2 h-6 w-6" />
          {isEditing ? "Edit" : "Add"} Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryId">Category *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Product Source *</Label>
            <Select value={formData.source} onValueChange={(value: "local" | "chinese") => setFormData({ ...formData, source: value })} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (৳) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="minimumQuantity">Minimum Order Quantity *</Label>
              <Input
                id="minimumQuantity"
                type="number"
                min="1"
                value={formData.minimumQuantity}
                onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image">Product Images (Multiple)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, "image")}
              disabled={uploading}
            />
            {formData.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="video">Product Video</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e, "video")}
              disabled={uploading}
            />
            {formData.videoUrl && <p className="text-sm text-muted-foreground mt-1">Video uploaded</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>
              {isEditing ? "Update" : "Create"}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">My Products</h2>
        {products.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">You haven't added any products yet.</p>
          </Card>
        ) : (
          products.map((product: any) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover" />
                  )}
                   <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Category: {product.categories?.name} | Source: {product.source}
                    </p>
                    <p className="text-xs mt-1">
                      <span className={`inline-block px-2 py-1 rounded ${
                        product.status === 'approved' ? 'bg-green-100 text-green-800' :
                        product.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status === 'approved' ? 'Approved' :
                         product.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WholesalerProducts;
