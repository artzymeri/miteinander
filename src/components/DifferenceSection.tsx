"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Shield, Heart, Clock, Star } from "lucide-react";

const bentoItems = [
  {
    id: 1,
    title: "Keine Agenturen",
    description:
      "Verbinden Sie sich direkt mit Pflegekräften. Keine Vermittlungsgebühren, keine versteckten Kosten.",
    icon: Users,
    size: "large",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025",
  },
  {
    id: 2,
    title: "Direkter Kontakt",
    description: "Kommunizieren Sie persönlich und bauen Sie echte Beziehungen auf.",
    icon: MessageSquare,
    size: "medium",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070",
  },
  {
    id: 3,
    title: "Vertraute Gemeinschaft",
    description: "Alle Pflegekräfte sind verifiziert und von der Community bewertet.",
    icon: Shield,
    size: "medium",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070",
  },
  {
    id: 4,
    title: "Mit Herz",
    description: "Menschlichkeit steht bei uns an erster Stelle.",
    icon: Heart,
    size: "small",
  },
  {
    id: 5,
    title: "Flexibel",
    description: "Buchen Sie Hilfe, wann Sie sie brauchen.",
    icon: Clock,
    size: "small",
  },
];

export default function DifferenceSection() {
  return (
    <section id="difference" className="py-24 md:py-32 bg-gradient-to-b from-background to-[#eae9e4]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="text-accent text-sm tracking-[0.2em] uppercase font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Warum Miteinander
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mt-4 mb-6">
            Der Unterschied
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Wir glauben an echte Verbindungen zwischen Menschen – ohne
            Zwischenhändler, ohne Bürokratie.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Large Card */}
          <motion.div
            className="col-span-2 row-span-2 relative group cursor-pointer shimmer-effect"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <img
                src={bentoItems[0].image}
                alt={bentoItems[0].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
            </div>
            <div className="relative z-10 h-full min-h-[400px] md:min-h-[500px] p-8 flex flex-col justify-end">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-serif text-white mb-3">
                {bentoItems[0].title}
              </h3>
              <p className="text-white/80 text-lg max-w-sm">
                {bentoItems[0].description}
              </p>
            </div>
          </motion.div>

          {/* Medium Cards */}
          {bentoItems.slice(1, 3).map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                className="col-span-1 row-span-1 relative group cursor-pointer shimmer-effect"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30" />
                </div>
                <div className="relative z-10 h-full min-h-[200px] md:min-h-[240px] p-6 flex flex-col justify-end">
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-serif text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/70 text-sm line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Small Cards */}
          {bentoItems.slice(3).map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                className="col-span-1 glass rounded-3xl p-6 cursor-pointer shimmer-effect"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-serif text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-muted text-sm">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
