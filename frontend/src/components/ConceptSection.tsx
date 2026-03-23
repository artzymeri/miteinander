"use client";

import { motion } from "framer-motion";
import { Search, MessageCircle, CalendarCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ConceptSection() {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: "01",
      title: t("concept.step1Title"),
      description: t("concept.step1Desc"),
      icon: Search,
      image: "https://images.unsplash.com/photo-1758612898258-398a43e7fd65?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      number: "02",
      title: t("concept.step2Title"),
      description: t("concept.step2Desc"),
      icon: MessageCircle,
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop",
    },
    {
      number: "03",
      title: t("concept.step3Title"),
      description: t("concept.step3Desc"),
      icon: CalendarCheck,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  return (
    <section id="concept" className="py-24 md:py-32 bg-background">
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
            {t("concept.badge")}
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mt-4 mb-6">
            {t("concept.title")}
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t("concept.subtitle")}
          </p>
        </motion.div>

        {/* Steps Cards with Horizontal Scroll Effect */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                className="group relative cursor-pointer shimmer-effect"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
                </div>

                <div className="relative z-10 h-full min-h-[320px] md:min-h-[380px] p-8 flex flex-col justify-end">
                  {/* Number */}
                  <span className="absolute top-4 left-6 text-7xl font-serif text-white/10 font-bold">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-serif text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/75 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Decorative line */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-accent rounded-b-3xl"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
