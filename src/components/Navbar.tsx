import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Heart, Menu, X, Gamepad2, User, LogOut, Settings, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore, useWishlistStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";

export const Navbar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const wishlistItems = useWishlistStore((state) => state.items);
  const { user, isAdmin, signOut } = useAuth();
  const { openAuthModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return "text-foreground hover:text-primary";
    return location.pathname.startsWith(path) ? "text-primary" : "text-foreground hover:text-primary";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 flex items-center justify-center group-hover:animate-wiggle">
              <img src="/bear-icon.png" alt="AYORI Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-xl md:text-2xl font-bold text-foreground">
              AYORI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`font-medium transition-colors ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/products" className={`font-medium transition-colors ${isActive('/products')}`}>
              Shop
            </Link>
            <Link to="/wishlist" className={`font-medium transition-colors ${isActive('/wishlist')}`}>
              Wishlist
            </Link>
            {isAdmin && (
              <Link to="/admin" className={`font-medium transition-colors ${isActive('/admin')}`}>
                Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-coral border-0">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                      <Package className="w-4 h-4 mr-2" />
                      All Orders (Admin)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="playful" size="sm" onClick={openAuthModal}>
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button - Replaced with Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[540px]">
                <SheetHeader className="text-left mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <img src="/bear-icon.png" alt="AYORI" className="w-full h-full object-contain" />
                    </div>
                    <SheetTitle className="font-display text-2xl font-bold">AYORI</SheetTitle>
                  </div>
                  <SheetDescription>
                    Explore our magical world of handmade plush toys.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                  <Link
                    to="/"
                    className="flex items-center gap-4 px-2 py-3 text-lg font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center gap-4 px-2 py-3 text-lg font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center gap-4 px-2 py-3 text-lg font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/cart"
                    className="flex items-center gap-4 px-2 py-3 text-lg font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Cart ({totalItems})
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-4 px-2 py-3 text-lg font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-primary hover:text-primary/80 transition-colors border-b border-border/50"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/orders"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      All Orders
                    </Link>
                  )}

                  {!user && (
                    <div className="mt-4">
                      <Button className="w-full" size="lg" onClick={() => { setIsSheetOpen(false); openAuthModal(); }}>
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </nav>
  );
};
