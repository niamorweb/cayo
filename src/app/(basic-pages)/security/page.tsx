"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  Lock,
  Server,
  Database,
  FileKey,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Layers,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// --- COMPONENTS ---

// Le "Paquet" de données qui voyage
const DataPacket = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1] z-20"
    initial={{ left: "10%", opacity: 0 }}
    animate={{
      left: ["10%", "50%", "90%"],
      opacity: [0, 1, 1, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear",
      delay: delay,
      times: [0, 0.5, 1],
    }}
  />
);

const TechCard = ({ icon: Icon, title, value, description }: any) => (
  <div className="group p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-24 h-24 text-white" />
    </div>
    <div className="relative z-10">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-indigo-400 group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs text-neutral-500 font-mono mb-1 uppercase tracking-wider">
        {title}
      </div>
      <div className="text-xl font-bold text-white mb-2">{value}</div>
      <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function SecurityPage() {
  const containerRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Nav (Simplified) */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Key className="text-black w-4 h-4" />
            </div>
            Cayo{" "}
            <span className="text-neutral-500 font-normal">/ Security</span>
          </Link>
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 rounded-full text-xs h-8"
          >
            Read Audit
          </Button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* --- HEADER --- */}
        <section className="px-6 max-w-5xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-[11px] font-medium text-green-400 mb-8"
          >
            <Shield className="w-3 h-3" />
            Zero-Knowledge Architecture
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            We can't see your data. <br />
            <span className="text-neutral-500">Even if we wanted to.</span>
          </motion.h1>

          <motion.p
            className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Cayo is built on a hybrid encryption model executed exclusively on
            the client-side. Your Master Password never leaves your device.
          </motion.p>
        </section>

        {/* --- ARCHITECTURE DIAGRAM (The "Wow" Element) --- */}
        <section className="px-6 max-w-7xl mx-auto mb-40">
          <div className="relative rounded-3xl border border-white/10 bg-[#050505] overflow-hidden">
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
              {/* ZONE 1: CLIENT */}
              <div className="flex flex-col items-center text-center gap-6 w-full md:w-1/3 relative group">
                <div className="w-24 h-24 rounded-2xl bg-neutral-900 border border-indigo-500/50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] flex items-center justify-center relative z-10">
                  <Key className="w-10 h-10 text-white" />
                  <div className="absolute -top-3 -right-3 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    SECURE
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Client Side</h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    Encryption happens here.
                    <br />
                    <span className="text-indigo-400">AES-256 + RSA</span>
                  </p>
                </div>
              </div>

              {/* ZONE 2: TRANSPORT (Animation) */}
              <div className="flex-1 w-full h-[100px] md:h-auto relative flex items-center justify-center">
                {/* The Wire */}
                <div className="absolute left-0 right-0 h-[2px] bg-neutral-800"></div>

                {/* Moving Packets */}
                <DataPacket delay={0} />
                <DataPacket delay={1.5} />

                {/* Center Server Node */}
                <div className="relative z-10 w-12 h-12 bg-[#050505] border border-neutral-700 rounded-full flex items-center justify-center text-neutral-500">
                  <Server className="w-5 h-5" />
                </div>

                {/* Label */}
                <div className="absolute bottom-[-30px] text-xs font-mono text-neutral-600 uppercase tracking-widest">
                  TLS 1.3 Transport
                </div>
              </div>

              {/* ZONE 3: DATABASE */}
              <div className="flex flex-col items-center text-center gap-6 w-full md:w-1/3">
                <div className="w-24 h-24 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center relative z-10">
                  <Database className="w-10 h-10 text-neutral-400" />
                  <div className="absolute -top-3 -right-3 bg-neutral-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ENCRYPTED BLOB
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Supabase DB</h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    Stores only gibberish.
                    <br />
                    <span className="text-neutral-600">No keys stored.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center text-xs text-neutral-500 font-mono">
              ARCHITECTURE DIAGRAM V1.0 • END-TO-END ENCRYPTION FLOW
            </div>
          </div>
        </section>

        {/* --- DEEP DIVE GRID --- */}
        <section className="px-6 max-w-7xl mx-auto mb-32">
          <h2 className="text-3xl font-bold mb-12 flex items-center gap-3">
            <Lock className="w-6 h-6 text-indigo-500" />
            Cryptographic Primitives
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TechCard
              icon={FileKey}
              title="Derivation"
              value="PBKDF2"
              description="Your Master Password is processed through 100,000 iterations of HMAC-SHA256 with a unique salt to derive your encryption key. We never see the password."
            />
            <TechCard
              icon={Shield}
              title="Symmetric"
              value="AES-256-CBC"
              description="Your actual data (passwords, notes) is encrypted using AES-256. This is the industry standard for securing top-secret information."
            />
            <TechCard
              icon={RefreshCw}
              title="Asymmetric"
              value="RSA-4096"
              description="We generate a Public/Private key pair. The Public key is used by family members to securely share the Group Key with you without exchanging secrets."
            />
            <TechCard
              icon={EyeOff}
              title="Privacy"
              value="Zero Knowledge"
              description="The server acts as a blind storage. It receives encrypted blobs and serves them back. It mathematically cannot decrypt the content."
            />
            <TechCard
              icon={Zap}
              title="Auto-Lock"
              value="Memory Purge"
              description="Using a Zustand stateful timer, the app automatically wipes decrypted keys from the RAM after 15 minutes of inactivity."
            />
            <TechCard
              icon={Layers}
              title="Database"
              value="Supabase"
              description="Row Level Security (RLS) policies enforce that only authenticated users can even retrieve the encrypted blobs intended for them."
            />
          </div>
        </section>

        {/* --- STACK SECTION --- */}
        <section className="py-20 border-y border-white/5 bg-white/[0.02]">
          <div className="px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6">
                  Modern Stack. <br /> Maximum Performance.
                </h2>
                <p className="text-neutral-400 mb-6">
                  Security shouldn't mean slow. Cayo is built with the latest
                  frontend technologies to ensure instant decryption and smooth
                  interactions.
                </p>
                <ul className="space-y-4">
                  {[
                    "Next.js 15 (App Router & Server Components)",
                    "Zustand Multi-store State Management",
                    "Request Deduplication & Intelligent Caching",
                    "Radix UI for 100% Accessibility",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-neutral-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 grid grid-cols-2 gap-4">
                {/* Visual blocks representing the stack */}
                <div className="p-6 rounded-xl bg-black border border-white/10 flex flex-col items-center justify-center text-center">
                  <Cpu className="w-8 h-8 text-white mb-3" />
                  <span className="font-bold">Next.js 15</span>
                </div>
                <div className="p-6 rounded-xl bg-black border border-white/10 flex flex-col items-center justify-center text-center">
                  <Layers className="w-8 h-8 text-white mb-3" />
                  <span className="font-bold">Zustand</span>
                </div>
                <div className="p-6 rounded-xl bg-black border border-white/10 flex flex-col items-center justify-center text-center">
                  <Zap className="w-8 h-8 text-white mb-3" />
                  <span className="font-bold">Framer Motion</span>
                </div>
                <div className="p-6 rounded-xl bg-black border border-white/10 flex flex-col items-center justify-center text-center">
                  <Shield className="w-8 h-8 text-white mb-3" />
                  <span className="font-bold">TypeScript</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FOOTER CTA --- */}
        <section className="py-32 text-center px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to audit the code?</h2>
          <p className="text-neutral-400 mb-10">
            Cayo is open-source. Trust, but verify.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 h-12">
              View on GitHub
            </Button>
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white rounded-full px-8 h-12"
            >
              Read Whitepaper
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
