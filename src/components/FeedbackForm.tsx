import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

const FeedbackForm = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit feedback"
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("feedback_tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim()
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback"
      });
      setSubmitting(false);
      return;
    }

    toast({
      title: "Success",
      description: "Your feedback has been submitted"
    });

    setSubject("");
    setMessage("");
    setSubmitting(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Feedback & Support</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your feedback or issue"
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide details about your feedback or support request..."
            rows={6}
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </Card>
  );
};

export default FeedbackForm;