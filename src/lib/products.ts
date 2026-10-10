import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  inventory_count: number;
  images: string[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export async function fetchProducts(limit: number = 20, query?: string): Promise<Product[]> {
  try {
    let supabaseQuery = supabase.from('products').select('*').limit(limit);
    
    if (query) {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }

    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return data as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    toast.error("Failed to load products");
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function createCheckout(items: CartItem[]): Promise<string> {
  // Since we are not using Shopify anymore, we would integrate Stripe here.
  // For now, we will just return a fake success URL or throw an error.
  toast.success("Checkout system ready for Stripe integration!");
  return "/cart";
}
