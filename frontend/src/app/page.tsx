"use client";

import { useState } from "react";
import CinematicLoader from "@/components/CinematicLoader";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ConceptSection from "@/components/ConceptSection";
import DifferenceSection from "@/components/DifferenceSection";
import AppSection from "@/components/AppSection";
import GetStartedSection from "@/components/GetStartedSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <CinematicLoader onLoadingComplete={() => setIsLoading(false)} />
      
      <main className={`${isLoading ? "overflow-hidden h-screen" : ""}`}>
        <Navbar />
        <Hero />
        <ConceptSection />
        <DifferenceSection />
        <AppSection />
        <GetStartedSection />
        <Footer />
      </main>
    </>
  );
}
