"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bufferToBase64,
  encryptWithAes,
  exportKeyToBase64,
  generateRsaKeyPair,
  importAesKeyFromBase64,
} from "@/lib/encryption/rsa";
import {
  decryptAESKey,
  encryptAESKey,
  generateAESKey,
} from "@/lib/encryption_aes";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const setDecryptedAesKey = useAuthStore((state) => state.setDecryptedAesKey);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const supabase = createClient();

  const handleGenerateKeys = () => {
    const aesKey = generateAESKey();

    const encryptedAesKey = encryptAESKey(aesKey, password);

    const decryptedAeskey = decryptAESKey(
      encryptedAesKey.encryptedKey,
      encryptedAesKey.iv,
      encryptedAesKey.salt,
      password
    );
  };

  async function signUpWithEmail(e: any) {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const aesKeyBase64 = generateAESKey();

      const encryptedAesKey = encryptAESKey(aesKeyBase64, password);

      if (!aesKeyBase64) {
        toast.error("Error creating account");
        setIsLoading(false);
        return;
      }

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

      const { cipher, iv } = await encryptWithAes(privateKeyBuffer, aesKey);

      const privateKeyBase64 = bufferToBase64(privateKeyBuffer);
      const encryptedPrivateKeyBase64 = bufferToBase64(cipher);
      const ivBase64 = bufferToBase64(iv);

      const { data: profileCreate, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
            personal_iv: encryptedAesKey.iv,
            personal_salt: encryptedAesKey.salt,
            rsa_public_key: publicKeyBase64,
            iv_rsa_private_key: ivBase64,
            encrypted_rsa_private_key: encryptedPrivateKeyBase64,
            display_name: displayName,
          },
        ]);
      if (!profileError) {
        const { data: profileData, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          setUser(data.user);
          setProfile(profileData);
          setDecryptedAesKey(aesKeyBase64);

          router.push("/start");
        }
      } else {
        toast.error("Error creating account");
        setIsLoading(false);
      }
    }
  }

  return (
    <section className="bg-neutral-100 overflow-hidden px-5 relative w-full flex items-center justify-center">
      <div className="container h-screen py-12 md:py-32 relative z-10 flex justify-center items-center">
        <div className="p-6 max-w-[450px] rounded-md border-neutral-800/10 w-full z-10 text-neutral-800 bg-white">
          <span className="w-fit text-left text-3xl md:text-4xl font-semibold tracking-tighter ">
            Create an account
          </span>

          <form className="flex flex-col mt-6">
            <div className="flex flex-col gap-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter an email address"
                className="h-11 "
                required
              />
            </div>
            <div className="flex flex-col gap-2 mb-6">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  placeholder="Enter a password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute p-2 hover:bg-neutral-50/10 rounded-sm  right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeClosed className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              disabled={isLoading || !email.trim() || !password.trim()}
              onClick={(e) => signUpWithEmail(e)}
              type="submit"
              size="lg"
              className="w-full h-11"
            >
              Signup
            </Button>
            <div className="mt-6 text-neutral-700">
              <span className="text-sm">
                Already have an account ?
                <Button variant="link">
                  <Link
                    className="underline underline-offset-2 duration-150 hover:underline"
                    href="/login"
                  >
                    Login to your account
                  </Link>
                </Button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
