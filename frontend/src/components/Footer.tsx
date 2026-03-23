"use client";

import { motion } from "framer-motion";
import { Instagram, Facebook, Linkedin, Twitter, Heart, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();
  
  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const footerLinks = [
    { name: t("footer.imprint"), href: "/impressum" },
    { name: t("footer.privacy"), href: "/datenschutz" },
    { name: t("footer.terms"), href: "/agb" },
  ];
  return (
    <footer id="footer" className="bg-primary text-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center p-1.5">
                <Image
                  src="/logo.svg"
                  alt="MyHelper Logo"
                  width={48}
                  height={40}
                  className="w-full h-full"
                />
              </div>
              <span className="font-serif text-xl font-semibold">
                MyHelper
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              MeritaCare
              <br />
              Rhoda Fideler
              <br />
              Im Hof 16
              <br />
              88069 Tettnang
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="font-serif text-lg mb-4">{t("nav.contact")}</h4>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                <a href="tel:+4915209465369" className="hover:text-white transition-colors">
                  +49 152/09465369
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} />
                <a href="mailto:info@merita.care" className="hover:text-white transition-colors">
                  info@merita.care
                </a>
              </li>
            </ul>
            <div className="flex gap-4 mt-5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={18} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="font-serif text-lg mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          className="h-px bg-white/20 mb-8"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />

        {/* Bottom */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p>{t("footer.copyright")}</p>
          <p className="flex items-center gap-1">
            Mit <Heart size={14} className="text-accent fill-accent" /> in Deutschland gemacht
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
