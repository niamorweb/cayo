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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setDecryptedAesKey, setUser, setProfile } = useAuthStore();

  /**
   * Orchestration de la création du compte et du coffre-fort chiffré
   */
  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Création du compte Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user)
        throw new Error(authError?.message || "Auth failed");

      // 2. Génération de la couche de sécurité (AES + RSA)
      const aesKeyBase64 = generateAESKey();
      if (!aesKeyBase64) throw new Error("Encryption engine failure");

      // Chiffrement de la clé AES par le password maître
      const encryptedAesKey = encryptAESKey(aesKeyBase64, password);

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

      // 3. Création du profil en base de données
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id, // On s'assure de lier l'ID
          personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
          personal_iv: encryptedAesKey.iv,
          personal_salt: encryptedAesKey.salt,
          rsa_public_key: publicKeyBase64,
          iv_rsa_private_key: ivBase64,
          encrypted_rsa_private_key: encryptedPrivateKeyBase64,
          display_name: email.split("@")[0], // Fallback simple pour le nom
        },
      ]);

      if (profileError) throw new Error("Profile creation failed");

      // 4. Récupération du profil complet pour synchroniser le store
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileData) {
        setUser(authData.user);
        setProfile(profileData);
        setDecryptedAesKey(aesKeyBase64);

        toast.success("Vault created successfully!");
        router.push("/start");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "An error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-neutral-100 min-h-screen px-5 flex items-center justify-center">
      <div className="w-full max-w-[450px] z-10">
        <div className="p-8 rounded-xl border border-neutral-200 shadow-sm bg-white">
          <h2 className="text-3xl font-semibold tracking-tighter text-neutral-900 mb-6">
            Create an account
          </h2>

          <form onSubmit={signUpWithEmail} className="space-y-4">
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
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !email || password.length < 8}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating secure vault...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-neutral-600 mt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
