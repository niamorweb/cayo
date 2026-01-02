"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { decryptText } from "@/lib/encryption/text";
import { getLogoUrl } from "@/lib/getLogoUrl";
import { Copy, Eye, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

// On définit une interface pour le secureSend
interface SecureSendProps {
  secureSend: {
    iv: string;
    name: string;
    username: string;
    password: string;
    website_url: string;
    note: string;
    text: string;
    type: "text" | "credential";
  };
}

export default function ClientSide({ secureSend }: SecureSendProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sécurité pour Next.js : s'assurer que window est disponible
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Récupération de la clé depuis le hash (#abc...)
  const key = window.location.hash.substring(1);

  // --- Correction du IV ---
  // Au lieu de Array.from, on garde le format Buffer ou Uint8Array
  // que decryptText attend (généralement Uint8Array en environnement web)
  const ivBuffer = Buffer.from(secureSend.iv, "base64");
  const ivUint8 = new Uint8Array(ivBuffer);

  // Si decryptText attend une string hexadécimale ou base64, passez secureSend.iv directement.
  // Mais si elle attend l'IV brut, Uint8Array est la norme.
  const lisibleSecureSend = {
    name: decryptText(secureSend.name, key, ivUint8 as any), // Le 'as any' aide si votre lib est typée strictement string
    username: decryptText(secureSend.username, key, ivUint8 as any),
    password: decryptText(secureSend.password, key, ivUint8 as any),
    url: decryptText(secureSend.website_url, key, ivUint8 as any),
    note: decryptText(secureSend.note, key, ivUint8 as any),
    text: decryptText(secureSend.text, key, ivUint8 as any),
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied !");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  }

  return secureSend && secureSend.type === "text" ? (
    <div className="w-full flex flex-1 justify-center bg-neutral-100 min-h-screen p-8">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="bg-white border border-border  rounded-xl p-4 flex items-center gap-4">
          <div className="bg-neutral-50 rounded-md border border-black/10 h-16 w-16 flex items-center justify-center">
            <span className="font-black text-4xl">C</span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl ">{lisibleSecureSend.name}</h3>
            <p className="uppercase text-black/60 text-sm">Secure send</p>
          </div>
        </div>
        <div className="bg-white border border-border  rounded-xl p-4 flex flex-col gap-4">
          <Label>Message</Label>
          <div className="relative">
            <div>{lisibleSecureSend.text}</div>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-6 relative z-10 text-black/70 ">
          <Link
            className="text-blue-500 duration-150 text-sm hover:underline"
            href="/login"
          >
            Manage your passwords on Cayo for Free
          </Link>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full flex flex-1 justify-center bg-neutral-100 min-h-screen p-8">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="bg-white border border-border  rounded-xl p-4 flex items-center gap-4">
          <div className="bg-neutral-50 rounded-md border border-black/10 h-16 w-16 flex items-center justify-center">
            {lisibleSecureSend.url ? (
              <Image
                src={getLogoUrl(lisibleSecureSend.url)}
                width={100}
                height={100}
                alt=""
                className="size-8"
              />
            ) : (
              <Globe className="size-8" />
            )}{" "}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl ">{lisibleSecureSend.name}</h3>
            <p className="uppercase text-black/60 text-sm">Secure send</p>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Username</Label>
            <div className="relative col-span-3">
              <input
                readOnly
                className={`p-2 rounded-lg w-full !outline-none `}
                value={lisibleSecureSend.username}
                type="text"
              />
              <Button
                onClick={() => copyToClipboard(lisibleSecureSend.username)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                variant="ghost"
              >
                <Copy />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Password</Label>
            <div className="relative col-span-3">
              <input
                readOnly
                className={`p-2 rounded-lg w-full !outline-none `}
                value={lisibleSecureSend.password}
                type={showPassword ? "text" : "password"}
              />
              <Button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-12 top-1/2 -translate-y-1/2"
                variant="ghost"
              >
                <Eye />
              </Button>
              <Button
                onClick={() => copyToClipboard(lisibleSecureSend.password)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                variant="ghost"
              >
                <Copy />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Website URL</Label>
            <div className="relative col-span-3">
              <input
                readOnly
                className={`p-2 rounded-lg w-full !outline-none `}
                type="text"
                placeholder="https://example.com"
                value={lisibleSecureSend.url}
              />
              <Button
                onClick={() => copyToClipboard(lisibleSecureSend.url)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                variant="ghost"
              >
                <Copy />
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border  rounded-xl p-4 flex flex-col gap-4">
          <Label>Notes</Label>
          <div className="relative">
            <textarea
              readOnly
              className={`rounded-lg w-full !outline-none `}
              value={lisibleSecureSend.note}
            />
            <Button
              onClick={() => copyToClipboard(lisibleSecureSend.note)}
              className="absolute right-2"
              variant="ghost"
            >
              <Copy />
            </Button>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-6 relative z-10 text-black/70 ">
          <Link
            className="text-blue-500 duration-150 text-sm hover:underline"
            href="/login"
          >
            Manage your passwords on Cayo for Free
          </Link>
        </div>
      </div>
    </div>
  );
}
