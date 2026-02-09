"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Search, MessageCircle, CalendarCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ConceptSection() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const steps = [
    {
      number: "01",
      title: t("concept.step1Title"),
      description: t("concept.step1Desc"),
      icon: Search,
      image: "https://images.unsplash.com/photo-1454418747937-bd95bb945625?q=80&w=2070",
    },
    {
      number: "02",
      title: t("concept.step2Title"),
      description: t("concept.step2Desc"),
      icon: MessageCircle,
      image: "https://images.unsplash.com/photo-1559523182-a284c3fb7cff?q=80&w=2074",
    },
    {
      number: "03",
      title: t("concept.step3Title"),
      description: t("concept.step3Desc"),
      icon: CalendarCheck,
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070",
    },
  ];
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <section id="concept" className="py-24 md:py-32 bg-background" ref={containerRef}>
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
                className="group"
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <div className="relative h-full glass rounded-3xl overflow-hidden p-8 hover:shadow-xl transition-all duration-500">
                  {/* Background Image */}
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Number */}
                    <span className="text-7xl font-serif text-accent/20 font-bold absolute -top-2 -left-2">
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                      <Icon className="w-7 h-7 text-accent" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-serif text-primary mb-4">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-accent"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
