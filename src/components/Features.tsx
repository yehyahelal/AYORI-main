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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Yadawi?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We put love and care into every stitch, creating magical companions for your little ones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-3xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
