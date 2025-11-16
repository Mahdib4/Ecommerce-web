import Navbar from "@/components/Navbar";
import FeedbackForm from "@/components/FeedbackForm";

const Feedback = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <FeedbackForm />
      </main>
    </div>
  );
};

export default Feedback;