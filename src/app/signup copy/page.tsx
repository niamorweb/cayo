"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignupPage() {
  // const [email, setEmail] = useState('admin6@gmail.co');
  // const [password, setPassword] = useState('Azerty13@@@@');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const setDecryptedAesKey = useAuthStore((state) => state.setDecryptedAesKey);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);

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

  async function signInWithEmail(e: any) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user) {
      const aesKeyBase64 = generateAESKey();

      const encryptedAesKey = encryptAESKey(aesKeyBase64, password);

      // const decryptedAeskey = decryptAESKey(
      //   encryptedAesKey.encryptedKey,
      //   encryptedAesKey.iv,
      //   encryptedAesKey.salt,
      //   password
      // );
      //
      if (!aesKeyBase64) {
        console.error("Clé AES introuvable dans le localStorage");
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

      // console.log("Public Key (Base64):", publicKeyBase64);
      // console.log("Private Key (Base64):", privateKeyBase64);
      // console.log("Encrypted Private Key (Base64):", encryptedPrivateKeyBase64);
      // console.log("IV (Base64):", ivBase64);

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

      //       //       setDecryptedAesKey(aesKeyBase64);
      localStorage.setItem("aes-key", aesKeyBase64);
      router.push("/s/vault");
    }
  }

  return (
    <section className="h-screen relative w-full flex items-center justify-center">
      <div className="absolute -z-10 top-0 right-0 left-0 bottom-0 hero-pattern"></div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h3 className="w-fit text-left">Get Started — It’s Free</h3>
          </CardTitle>
          <CardAction>
            <Button variant="link" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <form className="flex flex-col">
          <CardContent>
            <div className="flex flex-col gap-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter an email address"
                required
              />
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                type="text"
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter an email address"
                required
              />
            </div>
            <div className="flex flex-col gap-2 mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                placeholder="Enter a password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Link href="/login" className="text-blue-500">
              Try Login instead
            </Link>
          </CardContent>
          <CardFooter>
            <Button
              onClick={(e) => signInWithEmail(e)}
              type="submit"
              className="w-full"
              size="lg"
              disabled
            >
              Signup
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  );
}
