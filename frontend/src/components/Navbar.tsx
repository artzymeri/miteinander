"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/context/LanguageContext";

export default function Navbar() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: t("nav.howItWorks"), href: "#concept" },
    { name: t("nav.benefits"), href: "#difference" },
    { name: t("nav.app"), href: "#app" },
    { name: t("nav.contact"), href: "#footer" },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? "bg-transparent shadow-none" : `bg-white/50 backdrop-blur-md ${isScrolled ? "shadow-lg" : ""}`
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 3.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 relative z-[60]">
              <motion.div
                className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center p-1"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src="/logo.svg"
                  alt="MyHelper Logo"
                  width={40}
                  height={34}
                  className="w-full h-full"
                />
              </motion.div>
              <span className="font-serif text-xl text-primary font-semibold hidden sm:inline">
                MyHelper
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-primary/80 hover:text-primary transition-colors text-sm font-medium"
                  whileHover={{ y: -2 }}
                >
                  {item.name}
                </motion.a>
              ))}
              <motion.button
                className="bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-light transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("nav.getStarted")}
              </motion.button>
              <LanguageSwitcher />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-primary relative z-[60]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Full-screen Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden fixed inset-0 z-[55] bg-white/80 backdrop-blur-xl flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header with logo and close */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center p-1">
                <Image
                  src="/logo.svg"
                  alt="MyHelper Logo"
                  width={40}
                  height={34}
                  className="w-full h-full"
                />
              </div>
              <span className="font-serif text-xl text-primary font-semibold">
                MyHelper
              </span>
            </Link>
            <button
              className="text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col items-start justify-start flex-1 px-8 py-6 space-y-6 overflow-y-auto">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-2xl text-primary/80 hover:text-primary transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                {item.name}
              </motion.a>
            ))}

            <button
              className="w-full bg-accent text-white px-6 py-4 rounded-full text-lg font-medium hover:bg-accent-light transition-colors cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t("nav.getStarted")}
            </button>

            <div className="pt-4 border-t border-gray-200 w-full">
              <LanguageSwitcher fullWidth direction="up" />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
