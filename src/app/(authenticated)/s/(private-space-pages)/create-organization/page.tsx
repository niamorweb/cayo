"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  Users,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/client";
import { generateAESKey } from "@/lib/encryption_aes";
import { encryptWithRsaPublicKey } from "@/lib/encryption/rsa";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

export default function CreateOrganizationPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error(
        trimmedName.length === 0
          ? "Organization name is required"
          : "Name must be at least 2 characters long"
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Get User Profile for Public Key
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("rsa_public_key")
        .single();

      if (profileError || !profile?.rsa_public_key) {
        throw new Error("Failed to fetch user profile");
      }

      // 2. Create Org Row
      const { data: organizationCreated, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: trimmedName })
        .select("id")
        .single();

      if (orgError || !organizationCreated?.id) {
        throw new Error("Failed to create organization");
      }

      // 3. Generate & Encrypt Org Key
      const aesKeyGenerated = await generateAESKey();
      const encryptedAesKey = await encryptWithRsaPublicKey(
        aesKeyGenerated,
        profile.rsa_public_key
      );

      // 4. Add Member (Self as Admin)
      const { error: memberError } = await supabase
        .from("organizations_members")
        .insert({
          organization_id: organizationCreated.id,
          role: "admin",
          encrypted_aes_key: encryptedAesKey,
          has_accepted: true,
        });

      if (memberError) {
        throw new Error("Failed to create membership");
      }

      toast.success("Organization created successfully!");

      // 5. Refresh Data & Redirect
      await Promise.all([
        fetchAndStorePasswordsAndFolders(true),
        fetchAndDecryptOrganizations(true),
      ]);

      router.push(`/s/org/${organizationCreated.id}/vault`);
    } catch (error: any) {
      console.error("Creation error:", error);
      toast.error(error.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F9FB] w-full text-neutral-900">
      {/* --- HEADER (Sticky) --- */}
      <header className="h-14 md:h-16 border-b border-neutral-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Bouton retour mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-neutral-500 hover:text-neutral-900 md:hidden -ml-2"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 hidden md:block">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 tracking-wide">
              Create Organization
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            disabled={isLoading}
            className="hidden md:flex"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || name.trim().length < 2}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 shadow-sm h-9"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-3.5 w-3.5" />
            ) : (
              <Plus size={14} />
            )}
            <span className="hidden md:inline">Create Workspace</span>
            <span className="md:hidden">Create</span>
          </Button>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* INTRO HEADER */}
          <div className="flex items-start gap-4 md:gap-5">
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-2 text-indigo-600">
              <Users size={32} />
            </div>

            <div className="flex-1 pt-1 md:pt-2 space-y-1 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900">
                New Shared Workspace
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Organizations allow you to securely share passwords and manage
                access with team members.
              </p>
            </div>
          </div>

          <Separator />

          {/* FORM CARD */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 md:p-6 space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label
                htmlFor="orgName"
                className="text-xs font-semibold text-neutral-500 uppercase tracking-wider"
              >
                Organization Name
              </Label>
              <div className="relative">
                <Input
                  id="orgName"
                  autoFocus
                  placeholder="e.g. Acme Corp, Design Team..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  disabled={isLoading}
                  className="text-base md:text-lg h-11 md:h-12 bg-white border-neutral-200 focus:border-indigo-500/50 pl-4 pr-10"
                />
                {name.length > 2 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in">
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                This name will be visible to all members you invite.
              </p>
            </div>

            {/* Security Info Box */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-indigo-900">
                  Admin Privileges
                </h4>
                <p className="text-xs text-indigo-700/80 leading-relaxed">
                  As the creator, you will automatically be assigned the{" "}
                  <strong>Admin</strong> role. This gives you full control over
                  member management and billing settings. A unique AES-256
                  encryption key will be generated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
