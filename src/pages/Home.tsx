import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6">Wholesale Products BD</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Your trusted source for wholesale local and Chinese products. Quality guaranteed, competitive prices.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/local">
            <Button size="lg" className="gap-2">
              Browse Local Products <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/chinese">
            <Button size="lg" variant="outline" className="gap-2">
              Browse Chinese Products <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Categories</h3>
              <p className="text-muted-foreground">
                Explore our wide range of categories for both local and Chinese products
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Add to Cart</h3>
              <p className="text-muted-foreground">
                Select your items and add them to cart with minimum order quantities
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Order</h3>
              <p className="text-muted-foreground">
                Checkout with your details and receive confirmation via email
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
