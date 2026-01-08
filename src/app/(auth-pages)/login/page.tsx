"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { decryptAESKey } from "@/lib/encryption_aes";
import { logUserLogin } from "@/lib/log/log-login";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Imports UX/Motion/Validation
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Key,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- ZOD SCHEMA ---
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // States UI
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"idle" | "auth" | "decrypt">(
    "idle"
  );
  const [showPassword, setShowPassword] = useState(false);

  // Store
  const { setDecryptedAesKey, setUser, setProfile } = useAuthStore();

  // React Hook Form + Zod
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  // --- LOGIC (UNCHANGED) ---

  const completeLogin = async (user: any, passwordInput: string) => {
    try {
      setLoadingStep("decrypt"); // UX Update: Feedback visuel

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !profile) throw new Error("Profile not found");

      // Déchiffrement de la clé AES maîtresse avec le password utilisateur
      const decryptedAeskey = decryptAESKey(
        profile.personal_aes_encrypted_key,
        profile.personal_iv,
        profile.personal_salt,
        passwordInput // On utilise la valeur du form
      );

      setUser(user);
      setProfile(profile);
      setDecryptedAesKey(decryptedAeskey);

      await logUserLogin(user.id);
      router.push("/start");
    } catch (err) {
      console.error("Decryption error:", err);
      toast.error("Authentication successful, but vault decryption failed.");
      setIsLoading(false);
      setLoadingStep("idle");
    }
  };

  const onSubmit = async (formData: LoginSchema) => {
    setIsLoading(true);
    setLoadingStep("auth");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast.error(error.message);
      // UX: On set une erreur globale pour faire shaker le formulaire si besoin
      setError("root", { message: error.message });
      setIsLoading(false);
      setLoadingStep("idle");
      return;
    }

    if (data.user) {
      await completeLogin(data.user, formData.password);
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience (Same as Home) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] z-10"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4"
          >
            <Key className="text-black w-6 h-6" />
          </motion.div>
          <h1 className="!text-2xl font-bold !tracking-tight">Welcome back</h1>
          <p className="text-neutral-400 text-sm mt-2">
            Enter your credentials to unlock your vault.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
          {/* Subtle Border Glow on Hover */}
          <div className="absolute inset-0 border border-white/0 group-hover:border-white/5 rounded-2xl transition-colors pointer-events-none" />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 relative z-10"
          >
            {/* EMAIL INPUT */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-neutral-400 uppercase tracking-wider ml-1"
              >
                Email
              </Label>
              <div className="relative group/input">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 group-focus-within/input:text-indigo-400 transition-colors" />
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className={cn(
                    "h-11 pl-10 bg-neutral-900/50 border-white/10 text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-lg",
                    errors.email &&
                      "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                  )}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-400 text-xs flex items-center gap-1 ml-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-neutral-400 uppercase tracking-wider ml-1"
                >
                  Master Password
                </Label>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 group-focus-within/input:text-indigo-400 transition-colors" />
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className={cn(
                    "h-11 pl-10 pr-10 bg-neutral-900/50 border-white/10 text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-lg",
                    errors.password &&
                      "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                  )}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-400 text-xs flex items-center gap-1 ml-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* ERROR MESSAGE GLOBAL */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.root.message}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-white text-black hover:bg-neutral-200 font-medium rounded-lg mt-2 relative overflow-hidden"
              disabled={isLoading}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingStep === "decrypt"
                      ? "Decrypting Vault..."
                      : "Authenticating..."}
                  </motion.div>
                ) : (
                  <motion.div
                    key="label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    Access Vault <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-8">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white font-medium hover:underline hover:text-indigo-400 transition-colors"
          >
            Create your vault
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
