"use client";
import { ArrowLeft, Eye, Globe, Lock, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { randomBytes } from "crypto";
import { encryptText } from "@/lib/encryption/text";
import { Label } from "@/components/ui/label";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Separator } from "@/components/ui/separator";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationStore } from "@/lib/store/organizationStore";

// --- Interfaces de types ---
interface PasswordData {
  name: string;
  username: string;
  password: string;
  url: string;
  note: string;
  group_id: string;
}

interface Organization {
  id: string;
  decrypted_aes_key: string;
}

interface CreatePasswordProps {
  currentOrganization: Organization | null;
  setDisplayMode: (mode: "none" | "create-password" | "edit-password") => void;
}

export default function CreatePasswordInterface({
  currentOrganization,
  setDisplayMode,
}: CreatePasswordProps) {
  const [passwordData, setPasswordData] = useState<PasswordData>({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
    group_id: "null",
  });
  const [isLoading, setIsLoading] = useState(false);

  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );
  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  const handleInputChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    setDisplayMode("none");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // --- Correction du typage AES Key ---
    const finalAesKey: string | null = currentOrganization
      ? currentOrganization.decrypted_aes_key
      : aesKey;

    if (!finalAesKey) {
      toast.error("Encryption key missing. Please relog.");
      return;
    }

    setIsLoading(true); // Début du chargement
    const supabase = createClient();

    try {
      const iv = randomBytes(16);
      const ivArray = Array.from(iv);

      const encryptedData = {
        name: encryptText(passwordData.name, finalAesKey, iv),
        username: encryptText(passwordData.username, finalAesKey, iv),
        password: encryptText(passwordData.password, finalAesKey, iv),
        url: encryptText(passwordData.url, finalAesKey, iv),
        note: encryptText(passwordData.note, finalAesKey, iv),
        iv: ivArray,
        organization: currentOrganization ? currentOrganization.id : null,
        group_id: currentOrganization
          ? passwordData.group_id === "null"
            ? null
            : passwordData.group_id
          : null,
      };

      const { error: itemCreateError } = await supabase
        .from("passwords")
        .insert([encryptedData]);

      if (!itemCreateError) {
        await Promise.all([
          fetchAndStorePasswordsAndFolders(true),
          fetchAndDecryptOrganizations(true),
        ]);
        toast.success("Credential created!");
        setDisplayMode("none");
      } else {
        throw new Error(itemCreateError.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create credential");
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateGroup = () => {
      let group = "";
      for (let i = 0; i < 6; i++) {
        group += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return group;
    };
    const newPassword = `${generateGroup()}-${generateGroup()}-${generateGroup()}`;
    handleInputChange("password", newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 w-full flex flex-1 justify-center bg-neutral-100 md:w-3/5 md:relative p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="md:hidden mr-auto"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        {/* Header Section */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-neutral-50 rounded-md border border-neutral-200 h-16 w-16 flex items-center justify-center">
            <Globe className="size-8 text-neutral-400" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <input
              autoFocus
              placeholder="Credential name"
              disabled={isLoading}
              className="text-xl py-1 rounded-lg w-full outline-none bg-neutral-50 px-2 border border-transparent focus:border-neutral-200"
              value={passwordData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              type="text"
            />
            <Separator />
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              New entry
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex w-full flex-col gap-2 shadow-sm">
          <div className="grid grid-cols-5 items-center w-full">
            <Label className="col-span-2 text-neutral-500">Username</Label>
            <input
              placeholder="Username"
              disabled={isLoading}
              className="col-span-3 p-2 text-sm rounded-lg outline-none bg-neutral-50 border border-transparent focus:border-neutral-200"
              value={passwordData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              type="text"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-5 items-center w-full">
            <Label className="col-span-2 text-neutral-500">Password</Label>
            <div className="col-span-3 flex items-center gap-2">
              <input
                placeholder="Password"
                disabled={isLoading}
                className="p-2 rounded-lg w-full text-sm outline-none bg-neutral-50 border border-transparent focus:border-neutral-200"
                value={passwordData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                type="text"
              />
              <Button
                onClick={generatePassword}
                variant="outline"
                size="sm"
                type="button"
                disabled={isLoading}
              >
                Generate
              </Button>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 items-center w-full">
            <Label className="col-span-2 text-neutral-500">Website URL</Label>
            <input
              className="col-span-3 p-2 text-sm rounded-lg outline-none bg-neutral-50 border border-transparent focus:border-neutral-200"
              type="text"
              disabled={isLoading}
              placeholder="https://..."
              value={passwordData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
          <Label className="text-neutral-500">Notes</Label>
          <textarea
            placeholder="Add additional details..."
            disabled={isLoading}
            className="rounded-lg text-sm w-full outline-none bg-neutral-50 p-2 min-h-[100px] border border-transparent focus:border-neutral-200"
            value={passwordData.note}
            onChange={(e) => handleInputChange("note", e.target.value)}
          />
        </div>

        {/* Access Control */}
        {currentOrganization && (
          <div className="bg-white border border-neutral-200 rounded-xl p-4 grid grid-cols-5 items-center w-full gap-4 shadow-sm">
            <Label className="col-span-2 text-neutral-500">Shared with</Label>
            <Select
              disabled={isLoading}
              value={passwordData.group_id}
              onValueChange={(value) => handleInputChange("group_id", value)}
            >
              <SelectTrigger className="col-span-3 w-full h-10">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="null">
                    <div className="flex items-center gap-2">
                      <Eye size={14} /> Everyone
                    </div>
                  </SelectItem>
                  {orgGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <Lock size={14} /> {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-4 mt-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="rounded-xl h-12"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl h-12"
            disabled={isLoading || !passwordData.name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create credential"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
