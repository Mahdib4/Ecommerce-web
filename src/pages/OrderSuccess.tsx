import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle className="w-24 h-24 mx-auto mb-6 text-primary" />
      <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
        Thank you for your order. We've sent a confirmation email with your order details.
        We'll contact you shortly to confirm delivery.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
