"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
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
    { name: "Wie es funktioniert", href: "#concept" },
    { name: "Vorteile", href: "#difference" },
    { name: "App", href: "#app" },
    { name: "Kontakt", href: "#footer" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/50 backdrop-blur-md ${
        isScrolled ? "shadow-lg" : ""
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 3.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center p-1"
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src="/logo.svg"
                alt="Miteinander Logo"
                width={40}
                height={34}
                className="w-full h-full"
              />
            </motion.div>
            <span className="font-serif text-xl text-primary font-semibold hidden sm:inline">
              Miteinander
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
              onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Jetzt starten
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`md:hidden overflow-hidden`}
          initial={false}
          animate={{ height: isMobileMenuOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block text-primary/80 hover:text-primary transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <button 
              className="w-full bg-accent text-white px-6 py-3 rounded-full font-medium hover:bg-accent-light transition-colors cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Jetzt starten
            </button>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
