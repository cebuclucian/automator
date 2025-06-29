export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_STe3c7OWS5LDyK',
    priceId: 'price_1RYglnAQ5UIM4NTryLd6kjMP',
    name: 'Basic',
    description: 'Pachet automator basic',
    mode: 'subscription',
    price: 29.00,
    currency: 'EUR'
  },
  {
    id: 'prod_STe5QnDmGyqRmq',
    priceId: 'price_1RYgnmAQ5UIM4NTrOnMTgtkt',
    name: 'Pro',
    description: 'Pachet Automator Pro',
    mode: 'subscription',
    price: 49.00,
    currency: 'EUR'
  },
  {
    id: 'prod_STe4BWFGQAiJnx',
    priceId: 'price_1RYgmfAQ5UIM4NTrRcwYb4NW',
    name: 'Enterprise',
    description: 'Pachet Automator Enterprise',
    mode: 'subscription',
    price: 89.00,
    currency: 'EUR'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductByName(name: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.name.toLowerCase() === name.toLowerCase());
}