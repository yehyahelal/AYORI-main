import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted to-lavender-light">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/20 animate-float" />
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-mint animate-bounce-soft" />
      <div className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full bg-sunshine animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-40 right-1/3 w-8 h-8 rounded-full bg-coral/60 animate-bounce-soft" style={{ animationDelay: "0.5s" }} />

      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft">
              <Star className="w-4 h-4 text-sunshine fill-sunshine" />
              <span className="text-sm font-medium text-foreground">Handmade with love</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Magical Plush
              <span className="block text-primary">Friends Await!</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Discover our collection of handcrafted stuffed animals, made with the softest materials and endless love. Each toy is unique, just like your little one.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/products">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  View Collection
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Happy Kids</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Handmade</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-foreground">Safe</div>
                <div className="text-sm text-muted-foreground">Materials</div>
              </div>
            </div>
          </div>

          {/* Hero Image Area */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              {/* Background Blob */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-mint/40 to-sunshine/30 rounded-[3rem] transform rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-tl from-lavender/40 via-peach/30 to-primary/20 rounded-[3rem] transform -rotate-3" />

              {/* Placeholder for hero image */}
              <div className="relative z-10 w-full h-full flex items-center justify-center text-9xl animate-bounce-soft">
                🧸
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
