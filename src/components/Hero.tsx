import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted to-lavender-light">
      {/* Decorative Elements - Hidden or subtle on small mobile to avoid overflow */}
      <div className="absolute top-6 left-6 w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-primary/20 animate-float pointer-events-none" />
      <div className="absolute top-20 right-8 w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-mint animate-bounce-soft pointer-events-none hidden sm:block" />
      <div className="absolute bottom-12 left-1/4 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-sunshine animate-float pointer-events-none" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-1/3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-coral/60 animate-bounce-soft pointer-events-none hidden sm:block" style={{ animationDelay: "0.5s" }} />

      <div className="container mx-auto px-4 py-8 sm:py-14 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-4 sm:space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-card rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-soft">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sunshine fill-sunshine" />
              <span className="text-xs sm:text-sm font-medium text-foreground">Handmade with love</span>
            </div>

            <h1 className="font-display text-2.5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Magical Plush
              <span className="block text-primary">Friends Await!</span>
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Discover our collection of handcrafted stuffed animals, made with the softest materials and endless love. Each toy is unique, just like your little one.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-1">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base">
                  View Collection
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-2 sm:pt-4">
              <div className="text-center">
                <div className="font-display text-xl sm:text-2xl font-bold text-foreground">500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Happy Kids</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border" />
              <div className="text-center">
                <div className="font-display text-xl sm:text-2xl font-bold text-foreground">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Handmade</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border" />
              <div className="text-center">
                <div className="font-display text-xl sm:text-2xl font-bold text-foreground">Safe</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Materials</div>
              </div>
            </div>
          </div>

          {/* Hero Image Area */}
          <div className="relative flex items-center justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-[200px] sm:max-w-[260px] md:max-w-md aspect-square">
              {/* Background Blob */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-mint/40 to-sunshine/30 rounded-[2rem] sm:rounded-[3rem] transform rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-tl from-lavender/40 via-peach/30 to-primary/20 rounded-[2rem] sm:rounded-[3rem] transform -rotate-3" />

              {/* Placeholder for hero image */}
              <div className="relative z-10 w-full h-full flex items-center justify-center text-7xl sm:text-8xl md:text-9xl animate-bounce-soft select-none">
                🧸
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
