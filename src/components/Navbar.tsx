import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, User, LogOut, Store, MessageCircle, MessageSquare } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWholesaler, setIsWholesaler] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        
        setIsAdmin(roles?.some(r => r.role === "admin") || false);
        setIsWholesaler(roles?.some(r => r.role === "wholesaler") || false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .then(({ data: roles }) => {
            setIsAdmin(roles?.some(r => r.role === "admin") || false);
            setIsWholesaler(roles?.some(r => r.role === "wholesaler") || false);
          });
      } else {
        setIsAdmin(false);
        setIsWholesaler(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 lg:py-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-8">
          <Link to="/" className="text-xl lg:text-2xl font-bold hover:opacity-80 transition-opacity">
            Wholesale Products BD
          </Link>

          <form onSubmit={handleSearch} className="flex-1 lg:max-w-xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 lg:gap-4">
            {user && (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="h-10 w-10">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/feedback")} className="h-10 w-10">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {isWholesaler && (
              <Button variant="outline" onClick={() => navigate("/wholesaler")} className="h-10">
                <Store className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">My Shop</span>
              </Button>
            )}
            
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/admin")} className="h-10">
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">A</span>
              </Button>
            )}

            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-10 w-10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/auth")}
                className="h-10 w-10"
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {items.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;