import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Heart, Menu, X, Gamepad2, User, LogOut, Settings, Package, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore, useWishlistStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { AdminChangePasswordModal } from "@/components/AdminChangePasswordModal";
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center group-hover:animate-wiggle">
              <img src="/bear-icon.png" alt="Yadawi Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Yadawi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
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
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
                {wishlistItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs bg-coral border-0">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs bg-primary">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs sm:text-sm text-muted-foreground truncate">
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
                  <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                    <KeyRound className="w-4 h-4 mr-2 text-primary" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="playful" 
                size="sm" 
                onClick={openAuthModal}
                className="h-8 px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold shrink-0"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button - Replaced with Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 sm:h-9 sm:w-9">
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs sm:max-w-sm sm:w-[380px] p-5 sm:p-6">
                <SheetHeader className="text-left mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                      <img src="/bear-icon.png" alt="Yadawi" className="w-full h-full object-contain" />
                    </div>
                    <SheetTitle className="font-display text-xl sm:text-2xl font-bold">Yadawi</SheetTitle>
                  </div>
                  <SheetDescription className="text-xs sm:text-sm">
                    Explore our magical world of handmade plush toys.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-2 sm:gap-3">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-2 py-2.5 text-base font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 px-2 py-2.5 text-base font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center gap-3 px-2 py-2.5 text-base font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/cart"
                    className="flex items-center gap-3 px-2 py-2.5 text-base font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Cart ({totalItems})
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-3 px-2 py-2.5 text-base font-medium hover:text-primary transition-colors border-b border-border/50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-2 py-2.5 text-base font-medium text-primary hover:text-primary/80 transition-colors border-b border-border/50"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/orders"
                      className="flex items-center gap-3 px-2 py-2.5 text-base font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      All Orders
                    </Link>
                  )}

                  {user && (
                    <button
                      className="flex items-center gap-3 px-2 py-2.5 text-base font-medium text-foreground hover:text-primary transition-colors border-t border-border/50 text-left w-full"
                      onClick={() => {
                        setIsSheetOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                    >
                      <KeyRound className="w-4 h-4 text-primary" />
                      Change Password
                    </button>
                  )}

                  {!user && (
                    <div className="mt-4">
                      <Button className="w-full h-10 text-sm font-semibold" size="default" onClick={() => { setIsSheetOpen(false); openAuthModal(); }}>
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <AdminChangePasswordModal 
          open={isChangePasswordOpen} 
          onOpenChange={setIsChangePasswordOpen} 
        />
      </div>
    </nav>
  );
};
