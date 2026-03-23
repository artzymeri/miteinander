"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Shield, MapPin, Home, Accessibility, Pill, Heart, Sparkles, ChefHat, Car, Bath } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function DifferenceSection() {
  const { t } = useTranslation();
  
  const bentoItems = [
    {
      id: 1,
      title: t("difference.card1Title"),
      description: t("difference.card1Desc"),
      icon: Users,
      size: "large",
      image: "https://images.unsplash.com/photo-1609131257008-a5436a6238da?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      title: t("difference.card2Title"),
      description: t("difference.card2Desc"),
      icon: MessageSquare,
      size: "medium",
      image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070",
    },
    {
      id: 3,
      title: t("difference.card3Title"),
      description: t("difference.card3Desc"),
      icon: Shield,
      size: "medium",
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070",
    },
  ];
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
            {t("difference.badge")}
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mt-4 mb-6">
            {t("difference.title")}
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t("difference.subtitle")}
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

          {/* Wide Banner Card */}
          <motion.div
            className="col-span-2 relative group cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/85"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <span className="text-accent text-xs tracking-[0.15em] uppercase font-medium">
                  {t('difference.bannerBadge')}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-serif text-white mb-4 max-w-sm">
                {t('difference.bannerTitle')}
              </h3>
              {/* Care need category pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Home, label: t('difference.tagDailyLiving') },
                  { icon: Accessibility, label: t('difference.tagMobility') },
                  { icon: Pill, label: t('difference.tagMedication') },
                  { icon: Heart, label: t('difference.tagCompanionship') },
                  { icon: Sparkles, label: t('difference.tagHousekeeping') },
                  { icon: ChefHat, label: t('difference.tagMealPrep') },
                  { icon: Car, label: t('difference.tagTransportation') },
                  { icon: Bath, label: t('difference.tagHygiene') },
                ].map((tag, i) => {
                  const TagIcon = tag.icon;
                  return (
                    <motion.span
                      key={tag.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium border border-white/10"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                      whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.label}
                    </motion.span>
                  );
                })}
              </div>
            </div>
            {/* Decorative gradient orbs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
