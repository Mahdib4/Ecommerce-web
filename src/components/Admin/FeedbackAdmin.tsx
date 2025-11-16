import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  profile: { full_name: string; shop_name: string };
  replies: any[];
}

const FeedbackAdmin = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data: tickets } = await supabase
      .from("feedback_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!tickets) {
      setTickets([]);
      return;
    }

    // Fetch profiles and replies for each ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, shop_name")
          .eq("user_id", ticket.user_id)
          .single();

        const { data: replies } = await supabase
          .from("feedback_replies")
          .select("*")
          .eq("ticket_id", ticket.id)
          .order("created_at", { ascending: true });

        return {
          ...ticket,
          profile: profile || { full_name: "", shop_name: "" },
          replies: replies || []
        };
      })
    );

    setTickets(ticketsWithDetails);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("feedback_replies")
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: replyMessage.trim()
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reply"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Reply sent successfully"
    });

    setReplyMessage("");
    fetchTickets();
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    const { error } = await supabase
      .from("feedback_tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status"
      });
      return;
    }

    fetchTickets();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Feedback & Support</h2>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{ticket.subject}</h3>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  From: {ticket.profile?.full_name || ticket.profile?.shop_name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(ticket)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View & Reply
              </Button>
            </div>
            
            <p className="text-sm">{ticket.message}</p>
            
            <div className="flex gap-2 mt-4">
              {ticket.status !== "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(ticket.id, "open")}
                >
                  Mark as Open
                </Button>
              )}
              {ticket.status !== "in_progress" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(ticket.id, "in_progress")}
                >
                  Mark In Progress
                </Button>
              )}
              {ticket.status !== "resolved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(ticket.id, "resolved")}
                >
                  Mark Resolved
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">{selectedTicket?.message}</p>
            </div>

            {selectedTicket?.replies && selectedTicket.replies.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Replies</h4>
                {selectedTicket.replies.map((reply) => (
                  <div key={reply.id} className="bg-accent p-3 rounded-lg">
                    <p className="text-sm">{reply.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(reply.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
              />
              <Button onClick={handleReply}>Send Reply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackAdmin;