import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Package, Shield, Pencil, X, Mail, Search, Users, KeyRound, ShieldAlert } from 'lucide-react';
import { fetchProducts, type Product } from '@/lib/products';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AdminEmailSettingsModal } from '@/components/AdminEmailSettingsModal';
import { AdminManagementModal } from '@/components/AdminManagementModal';
import { AdminChangePasswordModal } from '@/components/AdminChangePasswordModal';
import { confirmDeleteProductAlert } from '@/lib/sweetAlert';

export default function Admin() {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('50');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Search & Filter state
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState('');
  const [inventoryCount, setInventoryCount] = useState('0');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: { pathname: '/admin' } } });
    }
  }, [user, loading, navigate]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => fetchProducts(100),
    enabled: !!user
  });

  // Fetch settings
  useEffect(() => {
    if (isAdmin) {
      supabase.from('store_settings').select('value').eq('key', 'delivery_fee').single()
        .then(({ data }) => {
          if (data) setDeliveryFee(data.value);
        });
    }
  }, [isAdmin]);

  const handleSaveFee = async () => {
    setIsSavingFee(true);
    const { error } = await supabase
      .from('store_settings')
      .upsert({ key: 'delivery_fee', value: deliveryFee });
      
    if (error) {
      toast({ title: 'Error', description: 'Failed to save fee', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Delivery fee saved' });
    }
    setIsSavingFee(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setProductType('');
    setInventoryCount('0');
    setImageFiles([]);
    setExistingImages([]);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setProductType(product.category || '');
    setInventoryCount(product.inventory_count?.toString() || '0');
    setExistingImages(product.images || []);
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages(existingImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setImageFiles(imageFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can manage products.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const uploadedUrls: string[] = [];

      // Upload all new image files
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // Combine remaining existing images with newly uploaded ones
      const finalImages = [...existingImages, ...uploadedUrls];

      const productData = {
        title,
        description,
        price: parseFloat(price),
        category: productType,
        inventory_count: parseInt(inventoryCount, 10) || 0,
        images: finalImages
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast({ title: 'Product Updated!', description: `${title} has been updated.` });
      } else {
        // Insert new
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast({ title: 'Product Added!', description: `${title} has been added to your store.` });
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save product';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can delete products.',
        variant: 'destructive'
      });
      return;
    }

    const confirmed = await confirmDeleteProductAlert(productTitle);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Product Deleted',
        description: `${productTitle} has been removed from your store.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  // Filter products by search and category
  const categories = Array.from(
    new Set((products || []).map((p) => p.category).filter(Boolean))
  ) as string[];

  const filteredProducts = (products || []).filter((p) => {
    const search = productSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search) ||
      (p.category && p.category.toLowerCase().includes(search));
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const outOfStockCount = (products || []).filter((p) => (p.inventory_count || 0) <= 0).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl text-primary mb-2">Access Restricted</h1>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => navigate('/')} variant="playful">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Responsive Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Admin Dashboard</h1>
              <Badge
                variant="outline"
                className={
                  isSuperAdmin
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-bold"
                    : "bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
                }
              >
                {isSuperAdmin ? 'SuperAdmin' : 'Admin'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Manage your cuddly plushies, store settings, and email notifications
            </p>
          </div>
          
          {/* Controls Bar: Delivery Fee + Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-3">
            {/* Delivery Fee Card */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-card border border-border/80 rounded-2xl px-3.5 py-2 shadow-sm">
              <Label htmlFor="deliveryFee" className="text-xs sm:text-sm font-semibold whitespace-nowrap text-foreground">
                Delivery Fee (EGP)
              </Label>
              <div className="flex items-center gap-1.5">
                <Input 
                  id="deliveryFee" 
                  type="number" 
                  className="w-20 h-8 sm:h-9 text-xs sm:text-sm font-bold bg-background text-center" 
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
                <Button size="sm" variant="secondary" className="h-8 sm:h-9 text-xs font-semibold px-2.5" onClick={handleSaveFee} disabled={isSavingFee}>
                  {isSavingFee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>

            {/* Actions: Manage Admins (Superadmin), Email Alerts, Orders, Password, Add Product */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              {isSuperAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsAdminManagementOpen(true)}
                  className="gap-2 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 text-foreground h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-xl"
                  title="Manage team admin accounts"
                >
                  <Users className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="truncate">Manage Admins</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsEmailModalOpen(true)}
                className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-foreground h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-xl"
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Email Alerts</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/orders')}
                className="gap-2 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-xl"
              >
                <Package className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Orders</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsChangePasswordOpen(true)}
                className="gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-xl"
                title="Change your account password"
              >
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Password</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="col-span-2 sm:col-span-1 gap-1.5 h-9 sm:h-10 text-xs sm:text-sm font-bold rounded-xl shadow-sm" onClick={handleOpenAdd}>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Add Product</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl">
                  {/* Sticky Header */}
                  <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60 shrink-0 pr-12 text-left">
                    <DialogTitle className="font-display text-xl sm:text-2xl text-foreground">
                      {editingId ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {editingId ? 'Update details for this plushie friend' : 'Add a brand new plushie to your online store'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Form with Scrollable Body and Pinned Footer */}
                  <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="overflow-y-auto flex-1 px-5 py-4 sm:px-6 sm:py-5 space-y-5 custom-scrollbar">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="title" className="text-xs sm:text-sm font-semibold">Product Name *</Label>
                          <Input
                            id="title"
                            placeholder="e.g. Fluffy Bear"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl h-10 text-sm"
                            required
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="description" className="text-xs sm:text-sm font-semibold">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Soft, cuddly, handcrafted with premium cotton..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="rounded-xl text-sm"
                          />
                        </div>
                        
                        {/* Responsive Grid: 1 col on mobile, 3 cols on tablet/desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="price" className="text-xs sm:text-sm font-semibold">Price (EGP) *</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              placeholder="299.00"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              className="rounded-xl h-10 text-sm"
                              required
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="type" className="text-xs sm:text-sm font-semibold">Category</Label>
                            <Input
                              id="type"
                              placeholder="e.g. Bears, Bunnies"
                              value={productType}
                              onChange={(e) => setProductType(e.target.value)}
                              className="rounded-xl h-10 text-sm"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="inventory" className="text-xs sm:text-sm font-semibold">Stock Quantity *</Label>
                            <Input
                              id="inventory"
                              type="number"
                              min="0"
                              value={inventoryCount}
                              onChange={(e) => setInventoryCount(e.target.value)}
                              className="rounded-xl h-10 text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 border-t border-border/60 pt-4">
                        <Label className="text-xs sm:text-sm font-semibold">Product Images</Label>
                        
                        {/* Images Gallery */}
                        {(existingImages.length > 0 || imageFiles.length > 0) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
                            {existingImages.map((url, idx) => (
                              <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-border/80 bg-muted/40 aspect-square">
                                <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExistingImage(idx)}
                                  className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                                  title="Remove Image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {imageFiles.map((file, idx) => (
                              <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-primary/40 bg-muted/40 aspect-square">
                                <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    New
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNewImage(idx)}
                                  className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                                  title="Remove Image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <Input
                            id="images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="cursor-pointer text-xs sm:text-sm rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={handleFileChange}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Select one or more photos. High quality square photos look best.
                        </p>
                      </div>
                    </div>
                    
                    {/* Sticky Footer */}
                    <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                        className="h-10 text-xs sm:text-sm rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="h-10 px-6 text-xs sm:text-sm font-bold rounded-xl shadow-sm"
                        variant="hero"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {editingId ? 'Save Changes' : 'Publish Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Products Management Card */}
        <Card className="border border-border/80 rounded-2xl sm:rounded-3xl shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b border-border/60 bg-muted/15 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                  <Package className="h-5 w-5 text-primary" />
                  <span>Products Catalog</span>
                  <Badge variant="secondary" className="font-mono text-xs ml-1">
                    {filteredProducts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  {products?.length || 0} total plushies in store inventory
                </CardDescription>
              </div>

              {/* Quick Inventory Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  {(products?.length || 0) - outOfStockCount} in stock
                </Badge>
                {outOfStockCount > 0 && (
                  <Badge variant="outline" className="text-xs font-medium border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5">
                    {outOfStockCount} out of stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Mobile & Desktop Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-background border-border/80"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* 1. MOBILE CARDS VIEW (Visible only on screens < md) */}
                <div className="block md:hidden divide-y divide-border/60">
                  {filteredProducts.map((product: Product) => (
                    <div key={product.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="relative shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <div className="relative">
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-16 w-16 rounded-xl object-cover border border-border/60 shadow-sm"
                              />
                              {product.images.length > 1 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                  +{product.images.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center border border-border/60">
                              <Package className="h-7 w-7 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-foreground text-sm truncate">{product.title}</h4>
                            <span className="font-display font-extrabold text-primary text-sm whitespace-nowrap">
                              EGP {Number(product.price).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {product.category && (
                              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-md font-medium">
                                {product.category}
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                (product.inventory_count || 0) > 0 
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
                                  : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5'
                              }`}
                            >
                              {(product.inventory_count || 0) > 0 ? `Stock: ${product.inventory_count}` : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5 text-primary border-primary/20 hover:bg-primary/10 rounded-xl"
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10 rounded-xl"
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW (Visible on md: and above) */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-16 pl-6">Image</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Product Name</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Category</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Price</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Stock</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: Product) => (
                        <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6">
                            {product.images && product.images.length > 0 ? (
                              <div className="relative inline-block">
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="h-12 w-12 rounded-xl object-cover border border-border/60 shadow-sm"
                                />
                                {product.images.length > 1 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    +{product.images.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center border border-border/60">
                                <Package className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{product.title}</TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="secondary" className="font-normal text-xs">
                                {product.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                            )}
                          </TableCell>
                          <TableCell className="font-display font-bold text-foreground">
                            EGP {Number(product.price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-semibold ${
                                (product.inventory_count || 0) > 0 
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
                                  : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5'
                              }`}
                            >
                              {product.inventory_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={() => handleOpenEdit(product)}
                                title="Edit Product"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => handleDeleteProduct(product.id, product.title)}
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  {productSearch ? 'No matching plushies found' : 'No products in store yet'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  {productSearch 
                    ? `No products matched "${productSearch}". Try adjusting your keywords or clearing the filter.` 
                    : 'Get started by adding your first cuddly handcrafted plush toy!'
                  }
                </p>
                {productSearch ? (
                  <Button onClick={() => { setProductSearch(''); setSelectedCategory('all'); }} variant="outline" size="sm" className="rounded-xl">
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={handleOpenAdd} variant="hero" size="sm" className="rounded-xl gap-2 font-bold shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AdminEmailSettingsModal
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
      />

      {/* SuperAdmin Management Modal */}
      {isSuperAdmin && (
        <AdminManagementModal
          open={isAdminManagementOpen}
          onOpenChange={setIsAdminManagementOpen}
        />
      )}

      {/* Admin Change Password Modal */}
      <AdminChangePasswordModal
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
}

