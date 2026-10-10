import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductInput {
  title: string;
  body?: string;
  product_type?: string;
  variants?: { price: string }[];
  images?: { file_path: string }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user and check admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.log('Admin check failed:', roleError?.message);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, product, productId } = body;

    const shopifyDomain = Deno.env.get('SHOPIFY_SHOP_DOMAIN');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

    if (!shopifyDomain || !shopifyAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Shopify not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shopifyAdminUrl = `https://${shopifyDomain}/admin/api/2024-01`;

    if (action === 'create') {
      const productData = product as ProductInput;
      
      const shopifyProduct = {
        product: {
          title: productData.title,
          body_html: productData.body || '',
          product_type: productData.product_type || '',
          variants: productData.variants?.map(v => ({
            price: v.price,
            inventory_management: null
          })) || [{ price: '0.00' }],
          images: productData.images?.map(img => ({
            src: img.file_path
          })) || []
        }
      };

      console.log('Creating product:', JSON.stringify(shopifyProduct));

      const response = await fetch(`${shopifyAdminUrl}/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken
        },
        body: JSON.stringify(shopifyProduct)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create product', details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      console.log('Product created:', result.product?.id);

      return new Response(
        JSON.stringify({ success: true, product: result.product }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      if (!productId) {
        return new Response(
          JSON.stringify({ error: 'Product ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting product:', productId);

      const response = await fetch(`${shopifyAdminUrl}/products/${productId}.json`, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify delete error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to delete product' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Product deleted successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
