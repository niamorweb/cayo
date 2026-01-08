"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  bufferToBase64,
  encryptWithAes,
  exportKeyToBase64,
  generateRsaKeyPair,
  importAesKeyFromBase64,
} from "@/lib/encryption/rsa";
import { encryptAESKey, generateAESKey } from "@/lib/encryption_aes";

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
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- ZOD SCHEMA ---
const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

type SignupSchema = z.infer<typeof signupSchema>;

// Étapes de chargement pour le feedback UX
type LoadingStage = "idle" | "auth" | "keys" | "encrypt" | "saving" | "success";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // UX States
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [showPassword, setShowPassword] = useState(false);

  const { setDecryptedAesKey, setUser, setProfile } = useAuthStore();

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  // --- LOGIC (UNCHANGED but wrapped in onSubmit) ---

  const onSubmit = async (formData: SignupSchema) => {
    try {
      setLoadingStage("auth");

      // 1. Création du compte Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError || !authData.user)
        throw new Error(authError?.message || "Auth failed");

      // 2. Génération de la couche de sécurité (AES + RSA)
      setLoadingStage("keys"); // UX Update: "Generating Keys..."

      // Petit délai artificiel (300ms) pour que l'utilisateur VOIT l'étape "Generating Keys"
      // C'est de la "Security Theater" utile pour rassurer sur la complexité
      await new Promise((r) => setTimeout(r, 500));

      const aesKeyBase64 = generateAESKey();
      if (!aesKeyBase64) throw new Error("Encryption engine failure");

      setLoadingStage("encrypt"); // UX Update: "Encrypting Vault..."

      // Chiffrement de la clé AES par le password maître
      const encryptedAesKey = encryptAESKey(aesKeyBase64, formData.password);

      // Génération de la paire RSA
      const aesKey = await importAesKeyFromBase64(aesKeyBase64);
      const keyPair = await generateRsaKeyPair();

      const publicKeyBase64 = await exportKeyToBase64(
        keyPair.publicKey,
        "spki"
      );
      const privateKeyBuffer = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      // Chiffrement de la clé privée RSA par la clé AES
      const { cipher, iv } = await encryptWithAes(privateKeyBuffer, aesKey);

      const encryptedPrivateKeyBase64 = bufferToBase64(cipher);
      const ivBase64 = bufferToBase64(iv);

      setLoadingStage("saving"); // UX Update: "Finalizing..."

      // 3. Création du profil en base de données
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
          personal_iv: encryptedAesKey.iv,
          personal_salt: encryptedAesKey.salt,
          rsa_public_key: publicKeyBase64,
          iv_rsa_private_key: ivBase64,
          encrypted_rsa_private_key: encryptedPrivateKeyBase64,
          display_name: formData.email.split("@")[0],
        },
      ]);

      if (profileError) throw new Error("Profile creation failed");

      // 4. Récupération du profil complet
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileData) {
        setUser(authData.user);
        setProfile(profileData);
        setDecryptedAesKey(aesKeyBase64);

        setLoadingStage("success");
        toast.success("Vault created successfully!");

        // Petit délai pour voir le succès avant redirect
        setTimeout(() => router.push("/start"), 800);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "An error occurred during signup");
      setLoadingStage("idle");
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[450px] z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4"
          >
            <ShieldCheck className="text-black w-6 h-6" />
          </motion.div>
          <h1 className="!text-2xl font-bold !tracking-tight">
            Create your Secure Vault
          </h1>
          <p className="text-neutral-400 text-sm mt-2 max-w-xs">
            End-to-end encrypted storage for you and your family.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
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
                Email Address
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
                    errors.email && "border-red-500/50 focus:border-red-500/50"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-neutral-400 uppercase tracking-wider ml-1"
              >
                Master Password
              </Label>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 group-focus-within/input:text-indigo-400 transition-colors" />
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className={cn(
                    "h-11 pl-10 pr-10 bg-neutral-900/50 border-white/10 text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500/50 transition-all rounded-lg",
                    errors.password &&
                      "border-red-500/50 focus:border-red-500/50"
                  )}
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
                <p className="text-red-400 text-xs ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Zero Knowledge Warning */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-xs flex gap-3 leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">
                  Do not forget your password.
                </span>
                We use Zero-Knowledge encryption. If you lose your password, we
                cannot recover your data.
              </div>
            </div>

            {/* SUBMIT BUTTON WITH DYNAMIC STATUS */}
            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium rounded-lg mt-2 relative overflow-hidden transition-all"
              disabled={loadingStage !== "idle"}
            >
              <AnimatePresence mode="wait">
                {loadingStage === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    Create Account <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}

                {loadingStage === "auth" && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying
                    Email...
                  </motion.div>
                )}

                {loadingStage === "keys" && (
                  <motion.div
                    key="keys"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating RSA
                    Keys...
                  </motion.div>
                )}

                {loadingStage === "encrypt" && (
                  <motion.div
                    key="encrypt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Encrypting
                    Vault...
                  </motion.div>
                )}

                {loadingStage === "saving" && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Finalizing...
                  </motion.div>
                )}

                {loadingStage === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Success
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-8">
          Already have a vault?{" "}
          <Link
            href="/login"
            className="text-white font-medium hover:underline hover:text-indigo-400 transition-colors"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
