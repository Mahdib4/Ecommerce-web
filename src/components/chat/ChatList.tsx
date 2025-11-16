import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Conversation {
  id: string;
  customer_id: string;
  wholesaler_id: string;
  updated_at: string;
  customer_profile?: { full_name: string };
  wholesaler_profile?: { shop_name: string };
}

const ChatList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserRole();
    fetchConversations();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setUserRole(data?.role || null);
  };

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Filter based on role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    let query = supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (roleData?.role !== "admin") {
      query = query.or(`customer_id.eq.${user.id},wholesaler_id.eq.${user.id}`);
    }

    const { data: conversations } = await query;

    if (!conversations) {
      setConversations([]);
      return;
    }

    // Fetch profiles for each conversation
    const conversationsWithProfiles = await Promise.all(
      conversations.map(async (conv) => {
        const { data: customerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", conv.customer_id)
          .single();

        const { data: wholesalerProfile } = await supabase
          .from("profiles")
          .select("shop_name")
          .eq("user_id", conv.wholesaler_id)
          .single();

        return {
          ...conv,
          customer_profile: customerProfile,
          wholesaler_profile: wholesalerProfile
        };
      })
    );

    setConversations(conversationsWithProfiles);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Conversations</h2>
      
      {conversations.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No conversations yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/chat/${conversation.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {userRole === "admin" 
                      ? `${conversation.customer_profile?.full_name || "Customer"} ↔ ${conversation.wholesaler_profile?.shop_name || "Wholesaler"}`
                      : conversation.customer_profile?.full_name || conversation.wholesaler_profile?.shop_name || "Chat"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;