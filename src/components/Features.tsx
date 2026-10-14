import { Sparkles, Heart, Truck, Shield } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Handmade with Love",
    description: "Each toy is carefully crafted by skilled artisans",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Safe Materials",
    description: "Only the softest, child-safe fabrics and fillings",
    color: "bg-coral/20 text-coral",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Delivered with care to your doorstep",
    color: "bg-mint text-secondary-foreground",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "100% satisfaction or your money back",
    color: "bg-lavender text-foreground",
  },
];

export const Features = () => {
  return (
    <section className="py-8 sm:py-14 md:py-20 bg-muted/30">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 sm:mb-3">
            Why Choose Yadawi?
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
            We put love and care into every stitch, creating magical companions for your little ones.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 text-center border border-border/40"
            >
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-2 sm:mb-4`}>
                <feature.icon className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-display text-xs sm:text-base md:text-lg font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
