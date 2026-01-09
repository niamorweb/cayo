"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  Wifi,
  CreditCard,
  Film,
  Globe,
  ArrowRight,
  Share2,
  Lock,
  Fingerprint,
  Server,
  EyeOff,
  Terminal,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// --- VISUAL ASSETS ---

// Composant pour les lignes de connexion animées
const ConnectionBeam = ({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) => (
  <div
    className={`absolute h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent w-full overflow-hidden ${className}`}
  >
    <motion.div
      className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-primary to-transparent blur-[2px]"
      animate={{ left: ["-100%", "200%"] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
        delay: delay,
      }}
    />
  </div>
);

// Carte "Mot de passe" flottante
const FloatingCard = ({ icon: Icon, label, user, delay, x, y }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: 1,
      scale: 1,
      y: [0, -15, 0], // Amplitude de flottement augmentée
    }}
    transition={{
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay * 2 },
    }}
    className={`absolute ${x} ${y} z-20`}
  >
    <div className="flex items-center gap-3 p-3 pr-6 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl hover:border-primary/50 transition-colors group cursor-default">
      <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          {label}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] text-indigo-400 font-bold">
            {user.charAt(0)}
          </div>
          <span className="text-[10px] text-neutral-500">
            Shared with {user}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

// Carte "Security Tech"
const TechSpec = ({ label, value, description }: any) => (
  <div className="p-6 rounded-xl bg-neutral-900/30 border border-white/5 hover:bg-neutral-900/50 transition-colors">
    <div className="text-xs text-primary font-mono mb-2 uppercase tracking-widest">
      {label}
    </div>
    <div className="text-xl font-bold text-white mb-2">{value}</div>
    <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
  </div>
);

export default function PortfolioStarPage() {
  const containerRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Ambient Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Key className="text-black w-4 h-4" />
            </div>
            Cayo
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/security"
              className="text-sm text-neutral-400 hover:text-white"
            >
              Security
            </Link>
            <Button
              asChild
              className="bg-white text-black hover:bg-neutral-200 rounded-full text-xs font-semibold h-8"
            >
              <Link href="/signup">Try it now</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10" ref={containerRef}>
        {/* --- HERO SECTION (SPLIT LAYOUT) --- */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* LEFT: Typography Content */}
          <div className="w-full lg:w-1/2 relative z-30 text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-neutral-300 mb-8 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Secure Family Protocol v1.0
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Stop texting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-600">
                your passwords.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-neutral-400 max-w-xl mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Cayo creates a secure mesh network for your family. Share
              streaming accounts, Wi-Fi, and pins without ever exposing the raw
              data.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full px-8 bg-white text-black hover:bg-neutral-200 font-medium text-base"
              >
                <Link href="/signup">
                  Start Vault
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Link
                href="/security"
                className="h-14 !flex items-center justify-center rounded-full px-8 border border-white/10 bg-transparent hover:bg-white/5"
              >
                How it works ?
              </Link>
            </motion.div>

            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center gap-4 text-xs text-neutral-500"
            >
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={`${src}?w=64&h=64&fit=crop&crop=faces`}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full border border-black object-cover bg-neutral-800"
                  />
                ))}
              </div>

              <p>Trusted by 1,000+ beta users</p>
            </motion.div>
          </div>

          {/* RIGHT: The Floating Network Visualization */}
          <div className="w-full lg:w-1/2 h-[500px] lg:h-[700px] relative perspective-1000">
            {/* Glow effect behind animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-600/20 blur-[120px] rounded-full" />

            {/* Central Hub */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/10 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border border-white/10 rounded-full border-dashed"
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black rounded-full border border-white/20 flex items-center justify-center z-30 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <Shield className="w-8 h-8 text-white" />
            </div>

            {/* Beams */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-white/5 -translate-y-1/2 rotate-[-30deg] origin-left">
                <ConnectionBeam delay={0} />
              </div>
              <div className="absolute top-1/2 left-1/2 w-[220px] h-[1px] bg-white/5 -translate-y-1/2 rotate-[30deg] origin-left">
                <ConnectionBeam delay={1.5} />
              </div>
              <div className="absolute top-1/2 left-1/2 w-[180px] h-[1px] bg-white/5 -translate-y-1/2 rotate-[150deg] origin-left">
                <ConnectionBeam delay={0.5} />
              </div>
              <div className="absolute top-1/2 left-1/2 w-[240px] h-[1px] bg-white/5 -translate-y-1/2 rotate-[210deg] origin-left">
                <ConnectionBeam delay={2} />
              </div>
            </div>

            {/* Floating Elements (Positioned relatively to the container center) */}
            <FloatingCard
              icon={Film}
              label="Netflix"
              user="Alice"
              delay={0.2}
              x="right-[10%]"
              y="top-[15%]"
            />
            <FloatingCard
              icon={Wifi}
              label="Wi-Fi"
              user="Guests"
              delay={0.4}
              x="right-[5%]"
              y="bottom-[20%]"
            />
            <FloatingCard
              icon={CreditCard}
              label="Revolut"
              user="Dad"
              delay={0.6}
              x="left-[5%]"
              y="top-[20%]"
            />
            <FloatingCard
              icon={Globe}
              label="Airbnb"
              user="Mom"
              delay={0.8}
              x="left-[0%]"
              y="bottom-[25%]"
            />
          </div>
        </section>

        {/* --- INFINITE MARQUEE --- */}
        <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden flex">
          <div className="flex gap-20 animate-marquee whitespace-nowrap min-w-full items-center justify-center opacity-30 grayscale">
            {[
              "AES-256",
              "PBKDF2",
              "Argon2",
              "Zero-Knowledge",
              "End-to-End Encrypted",
              "Open Source",
              "Audited",
            ].map((tech, i) => (
              <span
                key={i}
                className="text-lg font-mono tracking-widest text-neutral-500 flex items-center gap-4"
              >
                <Shield className="w-4 h-4" /> {tech}
              </span>
            ))}
          </div>
        </section>

        {/* --- NEW SECURITY DEEP DIVE SECTION --- */}
        <section className="py-32 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
              <div className="flex-1">
                <h2 className="text-4xl !text-neutral-200 font-bold mb-6">
                  Security isn't a feature.
                  <br />{" "}
                  <span className="text-neutral-500">
                    It's the architecture.
                  </span>
                </h2>
                <p className="text-neutral-400 text-lg leading-relaxed">
                  Cayo is built on a "Zero-Knowledge" architecture. This means
                  your data is encrypted
                  <strong> on your device</strong> using a key that you alone
                  possess. We never receive your raw passwords, only unreadable
                  encrypted blobs.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <TechSpec
                  label="Encryption"
                  value="AES-256-GCM"
                  description="Military-grade standard. Impossible to brute-force with current technology."
                />
                <TechSpec
                  label="Key Derivation"
                  value="Argon2id"
                  description="Protects your master password against rainbow table attacks."
                />
                <TechSpec
                  label="Transmission"
                  value="TLS 1.3"
                  description="All data in transit is protected by the latest transport layer security."
                />
                <TechSpec
                  label="Audit"
                  value="Open Source"
                  description="Our code is public. Anyone can verify our security implementation."
                />
              </div>
            </div>

            {/* Visual Diagram of Encryption */}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/20 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Terminal className="w-64 h-64 text-white" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                {/* Step 1 */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-500">
                    <Key className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      1. Local Encryption
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1 max-w-[200px]">
                      Data is encrypted on your device using your Master
                      Password.
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex flex-1 h-[2px] bg-neutral-800 relative mx-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent w-1/3 animate-shimmer"></div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10 text-neutral-400">
                    <Server className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      2. Sync Encrypted Blob
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1 max-w-[200px]">
                      Only the encrypted gibberish reaches our servers. We can't
                      read it.
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex flex-1 h-[2px] bg-neutral-800 relative mx-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent w-1/3 animate-shimmer"></div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <EyeOff className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      3. Secure Sharing
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1 max-w-[200px]">
                      Keys are exchanged securely to allow family access without
                      leaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BENTO GRID FEATURES --- */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl !text-neutral-200 font-bold mb-6">
              Built for <span className="text-neutral-500">real life.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
            {/* Large Card Left */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/40 p-10 hover:bg-neutral-900/60 transition-colors">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                  <Share2 />
                </div>
                <h3 className="text-2xl font-bold mb-2">Group Sync Protocol</h3>
                <p className="text-neutral-400 max-w-sm">
                  Changes made by one member update instantly on everyone's
                  device. Conflicts are resolved automatically.
                </p>
              </div>
              <div className="absolute right-[-50px] bottom-[-50px] w-[300px] h-[300px] bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-[80px] group-hover:blur-[60px] transition-all" />
            </div>

            {/* Tall Card Right */}
            <div className="md:col-span-1 relative group overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/40 p-10 hover:bg-neutral-900/60 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                  <Lock />
                </div>
                <h3 className="text-2xl font-bold mb-2">Strictly Private</h3>
                <p className="text-neutral-400 text-sm">
                  Separate your personal vault from shared family items.
                </p>
              </div>
              <div className="relative mt-10 h-40 w-full flex items-center justify-center">
                <Shield className="w-32 h-32 text-neutral-800 group-hover:text-purple-500/20 transition-colors duration-500" />
              </div>
            </div>

            {/* Bottom Wide Card */}
            <div className="md:col-span-3 relative group overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/40 p-10 hover:bg-neutral-900/60 transition-colors flex items-center justify-between">
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Fingerprint className="text-green-400" />
                  <span className="text-green-400 font-mono text-xs uppercase tracking-wider">
                    Biometric Ready
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  FaceID & TouchID Native
                </h3>
                <p className="text-neutral-400">
                  Unlock your vault in milliseconds using your device's native
                  hardware security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-40 px-6 text-center">
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-30 pointer-events-none" />
            <h2 className="text-5xl md:text-7xl !text-neutral-200 font-bold mb-8 relative z-10">
              Secure your legacy.
            </h2>
            <Button
              asChild
              size="lg"
              className="h-16 px-10 rounded-full text-lg bg-white text-black hover:bg-neutral-200 relative z-10"
            >
              <Link href="/signup">Try Cayo Beta</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
