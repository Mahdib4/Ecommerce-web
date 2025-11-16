import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ban } from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  shop_name: string;
}

const SuspensionsAdmin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [suspensions, setSuspensions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("1");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
    fetchSuspensions();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, shop_name");
    
    setProfiles(data || []);
  };

  const fetchSuspensions = async () => {
    const { data } = await supabase
      .from("user_suspensions")
      .select(`
        *,
        profile:profiles!user_suspensions_user_id_fkey(full_name, shop_name)
      `)
      .order("created_at", { ascending: false });
    
    setSuspensions(data || []);
  };

  const handleSuspend = async () => {
    if (!selectedUserId || !reason) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a user and provide a reason"
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let suspendedUntil = null;
    let isPermanent = false;

    if (duration === "permanent") {
      isPermanent = true;
    } else {
      const days = parseInt(duration);
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + days);
    }

    const { error } = await supabase
      .from("user_suspensions")
      .insert({
        user_id: selectedUserId,
        suspended_by: user.id,
        reason,
        suspended_until: suspendedUntil?.toISOString(),
        is_permanent: isPermanent
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suspend user"
      });
      return;
    }

    toast({
      title: "Success",
      description: "User has been suspended"
    });

    setSelectedUserId("");
    setReason("");
    setDuration("1");
    fetchSuspensions();
  };

  const handleLiftSuspension = async (suspensionId: string) => {
    const { error } = await supabase
      .from("user_suspensions")
      .delete()
      .eq("id", suspensionId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lift suspension"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Suspension has been lifted"
    });

    fetchSuspensions();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Suspensions</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Ban className="h-4 w-4 mr-2" />
              Suspend User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.full_name || profile.shop_name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this user is being suspended..."
                />
              </div>

              <Button onClick={handleSuspend} className="w-full">
                Suspend User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {suspensions.map((suspension) => (
          <Card key={suspension.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {suspension.profile?.full_name || suspension.profile?.shop_name || "Unknown User"}
                </h3>
                <p className="text-sm text-muted-foreground">{suspension.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {suspension.is_permanent 
                    ? "Permanent suspension" 
                    : `Until ${new Date(suspension.suspended_until).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLiftSuspension(suspension.id)}
              >
                Lift Suspension
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SuspensionsAdmin;