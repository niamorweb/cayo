"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock,
  ShieldCheck,
  FileText,
  Key,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { decryptText } from "@/lib/encryption/text";
import { getLogoUrl } from "@/lib/getLogoUrl";
import { cn } from "@/lib/utils";

// --- Interfaces ---
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

// --- Composant Helper pour les champs en lecture seule ---
const ReadOnlyField = ({
  label,
  value,
  isPassword = false,
  onCopy,
}: {
  label: string;
  value?: string;
  isPassword?: boolean;
  onCopy?: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-1.5 py-2">
      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
        {label}
      </Label>
      <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg group hover:border-indigo-200 transition-colors">
        <div
          className={cn(
            "text-sm text-neutral-800 truncate font-medium flex-1 font-mono",
            isPassword && !show && "tracking-widest"
          )}
        >
          {isPassword && !show ? "••••••••••••••••" : value}
        </div>
        <div className="flex items-center gap-1">
          {isPassword && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-colors",
              copied
                ? "text-green-600 bg-green-50"
                : "text-neutral-400 hover:text-indigo-600"
            )}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ClientSide({ secureSend }: SecureSendProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);

    // Logique de déchiffrement au montage
    try {
      const key = window.location.hash.substring(1);
      if (!key) return;

      const ivBuffer = Buffer.from(secureSend.iv, "base64");
      const ivUint8 = new Uint8Array(ivBuffer);

      const data = {
        name: decryptText(secureSend.name, key, ivUint8 as any),
        username: decryptText(secureSend.username, key, ivUint8 as any),
        password: decryptText(secureSend.password, key, ivUint8 as any),
        url: decryptText(secureSend.website_url, key, ivUint8 as any),
        note: decryptText(secureSend.note, key, ivUint8 as any),
        text: decryptText(secureSend.text, key, ivUint8 as any),
      };
      setDecryptedData(data);
    } catch (e) {
      console.error("Decryption failed", e);
      toast.error(
        "Impossible de déchiffrer les données. Le lien est peut-être invalide."
      );
    }
  }, [secureSend]);

  if (!isMounted || !decryptedData) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié !");
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent" />

      {/* Main Card */}
      <div className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-white mb-4 shadow-xl shadow-neutral-200">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Secure Share</h1>
          <p className="text-neutral-500 text-sm mt-2 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
            <ShieldCheck size={12} className="text-green-600" />
            Decrypted locally in your browser
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl shadow-neutral-200/50 overflow-hidden">
          {/* Item Header */}
          <div className="p-6 pb-4 flex items-start gap-4 border-b border-neutral-100 bg-neutral-50/30">
            <div className="shrink-0 w-14 h-14 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm text-indigo-500">
              {secureSend.type === "text" ? (
                <FileText size={24} />
              ) : decryptedData.url ? (
                <Image
                  src={getLogoUrl(decryptedData.url)}
                  width={32}
                  height={32}
                  alt="Logo"
                  className="object-contain"
                />
              ) : (
                <Key size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-lg font-bold text-neutral-900 truncate">
                {decryptedData.name}
              </h2>
              <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mt-1">
                {secureSend.type === "text" ? "Encrypted Note" : "Credential"}
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {secureSend.type === "text" ? (
              // TEXT VIEW
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Message Content
                </Label>
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-800 font-mono whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                  {decryptedData.text}
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(decryptedData.text)}
                    className="gap-2"
                  >
                    <Copy size={14} /> Copy full text
                  </Button>
                </div>
              </div>
            ) : (
              // CREDENTIAL VIEW
              <div className="flex flex-col gap-1">
                <ReadOnlyField
                  label="Username"
                  value={decryptedData.username}
                  onCopy={() => copyToClipboard(decryptedData.username)}
                />
                <div className="my-1 border-t border-neutral-100/50" />
                <ReadOnlyField
                  label="Password"
                  value={decryptedData.password}
                  isPassword={true}
                  onCopy={() => copyToClipboard(decryptedData.password)}
                />
                {decryptedData.url && (
                  <>
                    <div className="my-1 border-t border-neutral-100/50" />
                    <ReadOnlyField
                      label="Website"
                      value={decryptedData.url}
                      onCopy={() => copyToClipboard(decryptedData.url)}
                    />
                  </>
                )}
                {decryptedData.note && (
                  <>
                    <div className="my-1 border-t border-neutral-100/50" />
                    <div className="py-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Note
                      </Label>
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900">
                        {decryptedData.note}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Warning Footer */}
          <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-[11px] text-neutral-500 font-medium">
              Please copy this data immediately. This link may expire.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">
            Powered by Cayo Security
          </p>
          <Link href="/signup">
            <Button
              variant="outline"
              className="rounded-full px-6 bg-white border-neutral-200 hover:bg-neutral-50 hover:text-indigo-600 transition-all"
            >
              Create your own secure link
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
