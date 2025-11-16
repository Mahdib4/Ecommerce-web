import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsAdmin = () => {
  const [bkashNumber, setBkashNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "bkash_payment_number")
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settings",
      });
      return;
    }

    if (data) {
      setBkashNumber(data.value);
    }
  };

  const handleUpdateBkashNumber = async () => {
    if (!bkashNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Bkash number cannot be empty",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("settings")
      .update({ value: bkashNumber })
      .eq("key", "bkash_payment_number");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bkash number",
      });
    } else {
      toast({
        title: "Success",
        description: "Bkash payment number updated successfully",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">Manage payment and system configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bkash Payment Number</CardTitle>
          <CardDescription>
            Update the bkash number where customers will send advance payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bkashNumber">Bkash Number</Label>
            <Input
              id="bkashNumber"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              placeholder="Enter bkash number (e.g., 01712345678)"
            />
          </div>
          <Button onClick={handleUpdateBkashNumber} disabled={loading}>
            {loading ? "Updating..." : "Update Bkash Number"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsAdmin;
