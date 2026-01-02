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
/* import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"; */
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"login-form" | "login-otp">("login-form");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setDecryptedAesKey, setUser, setProfile } = useAuthStore();

  const completeLogin = async (user: any) => {
    try {
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
        password
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
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Logique MFA mise en pause pour l'instant
      /* const factors = data.user.factors?.filter((f) => f.status === "verified");
      if (factors && factors.length > 0) {
        setFactorId(factors[0].id);
        setStep("login-otp");
        setIsLoading(false);
        return;
      } 
      */

      await completeLogin(data.user);
    }
  };

  /* const verifyOTP = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: otpValue,
    });
    if (error) {
      toast.error("Invalid OTP code");
      setOtpValue("");
      setIsLoading(false);
      return;
    }
    await completeLogin(data.user);
  }; 
  */

  return (
    <section className="bg-neutral-100 min-h-screen px-5 flex items-center justify-center">
      <div className="w-full max-w-[450px] z-10">
        <div className="p-8 rounded-xl border border-neutral-200 shadow-sm bg-white">
          <h2 className="text-3xl font-semibold tracking-tighter text-neutral-900 mb-6">
            Welcome back
          </h2>

          <form onSubmit={signInWithEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlocking vault...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <p className="text-center text-sm text-neutral-600 mt-4">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
