import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatList from "@/components/chat/ChatList";

const Chat = () => {
  const { conversationId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {conversationId ? (
          <ChatWindow conversationId={conversationId} />
        ) : (
          <ChatList />
        )}
      </main>
    </div>
  );
};

export default Chat;