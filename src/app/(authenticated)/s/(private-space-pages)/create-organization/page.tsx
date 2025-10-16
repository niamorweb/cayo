"use client";
import CardDisplay from "@/components/global/card-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateAESKey } from "@/lib/encryption_aes";
import { encryptWithRsaPublicKey } from "@/lib/encryption/rsa";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useRouter } from "next/navigation";

export default function Page() {
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
          : "Organization name must be at least 2 characters long"
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("rsa_public_key")
        .single();

      if (profileError || !profile?.rsa_public_key) {
        toast.error("Failed to fetch user profile");
        return;
      }

      const { data: organizationCreated, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: trimmedName })
        .select("id")
        .single();

      if (orgError || !organizationCreated?.id) {
        toast.error("Failed to create organization");
        return;
      }

      const aesKeyGenerated = await generateAESKey();
      const encryptedAesKey = await encryptWithRsaPublicKey(
        aesKeyGenerated,
        profile.rsa_public_key
      );

      const { error: memberError } = await supabase
        .from("organizations_members")
        .insert({
          organization_id: organizationCreated.id,
          role: "admin",
          encrypted_aes_key: encryptedAesKey,
          has_accepted: true,
        });

      if (memberError) {
        toast.error(
          memberError.code === "23505"
            ? "You are already a member of this organization"
            : "Failed to create organization membership"
        );
        return;
      }

      toast.success("Organization created successfully!");

      await fetchAndStorePasswordsAndFolders(true);
      await fetchAndDecryptOrganizations(true);

      router.push(`/s/org/${organizationCreated.id}/vault`);
    } catch (error) {
      console.error("Organization creation error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardDisplay
      actionBtns={
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={name.trim().length < 2 || isLoading}
          type="submit"
        >
          {isLoading ? "Creating..." : "Create organization"}
        </Button>
      }
      title="Create an organization"
      description="Organizations allow you to securely share passwords and manage access with team members"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          onChange={(e) => setName(e.target.value)}
          value={name}
          placeholder="Family..."
          maxLength={100}
          disabled={isLoading}
          required
        />
      </div>
    </CardDisplay>
  );
}
