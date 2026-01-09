"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useOrganizationStore } from "@/lib/store/organizationStore";

import { Shield, Users, ChevronRight, LayoutGrid, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const SpaceCard = ({
  href,
  icon: Icon,
  title,
  subtitle,
  colorClass,
  delay = 0,
}: any) => (
  //@ts-ignore
  <motion.div variants={itemVariants}>
    <Link href={href} className="group relative block w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#0A0A0A] hover:bg-[#111] hover:border-white/10 transition-all duration-300 group-hover:translate-x-1">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner",
              colorClass
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base font-semibold text-white group-hover:text-primary transition-colors">
              {title}
            </span>
            <span className="text-xs text-neutral-500">{subtitle}</span>
          </div>
        </div>
        <div className="text-neutral-600 group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300">
          <ChevronRight size={20} />
        </div>
      </div>
    </Link>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#0A0A0A]">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-neutral-900 animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="w-24 h-4 bg-neutral-900 rounded animate-pulse" />
        <div className="w-16 h-3 bg-neutral-900 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

export default function StartPage() {
  const organizations = useOrganizationStore((s) => s.organizations);
  const [isLoading, setIsLoading] = useState(true);

  // Correction: Unification des useEffects pour éviter les doubles appels
  useEffect(() => {
    let isMounted = true;

    const loadOrganizations = async () => {
      // Petit délai artificiel pour laisser l'animation de loading se jouer (UX)
      // et éviter le "flash" si la réponse est trop rapide (50ms)
      const start = Date.now();
      await fetchAndDecryptOrganizations();
      const end = Date.now();

      if (isMounted) {
        // Si ça a pris moins de 400ms, on attend un peu pour la fluidité
        const delay = Math.max(0, 600 - (end - start));
        setTimeout(() => setIsLoading(false), delay);
      }
    };

    loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse duration-[10s]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-[#050505]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* HEADER */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg"
            >
              <LayoutGrid className="w-6 h-6 text-white" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold tracking-tight mb-2"
            >
              Where do you want to go?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-400 text-sm"
            >
              Access your personal vault or manage a group.
            </motion.p>
          </div>

          {/* LIST CONTAINER */}
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* PERSONAL SECTION */}
            <div className="space-y-3">
              <motion.h4
                //@ts-ignore
                variants={itemVariants}
                className="text-xs font-semibold text-neutral-500 uppercase tracking-widest pl-2"
              >
                Personal Workspace
              </motion.h4>
              <SpaceCard
                href="/s/vault"
                icon={Shield}
                title="Private Vault"
                subtitle="Only you can see this"
                colorClass="bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300"
              />
            </div>

            {/* SHARED SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-2 pr-1">
                <motion.h4
                  //@ts-ignore
                  variants={itemVariants}
                  className="text-xs font-semibold text-neutral-500 uppercase tracking-widest"
                >
                  Shared Workspaces
                </motion.h4>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <SkeletonCard />
                      <SkeletonCard />
                    </motion.div>
                  ) : organizations && organizations.length > 0 ? (
                    organizations.map((org, i) => (
                      <SpaceCard
                        key={org.id || i}
                        href={"/s/org/" + org.id + "/vault"}
                        icon={Users}
                        title={org.name}
                        subtitle={`${org.members_count || "Multiple"} members`} // Fallback si members_count n'existe pas
                        colorClass="bg-neutral-800 text-neutral-300 group-hover:bg-white group-hover:text-black transition-colors duration-300"
                      />
                    ))
                  ) : (
                    <motion.div
                      //@ts-ignore
                      variants={itemVariants}
                      className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center"
                    >
                      <p className="text-sm text-neutral-400">
                        No organizations found.
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Join or create a group to start sharing.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
