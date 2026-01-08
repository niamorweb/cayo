"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { randomBytes } from "crypto";
import { toast } from "sonner";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Save,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Globe2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { encryptText } from "@/lib/encryption/text";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { createClient } from "@/lib/supabase/client";
import { getLogoUrl } from "@/lib/getLogoUrl";

// --- Interfaces ---
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
  // State
  const [passwordData, setPasswordData] = useState<PasswordData>({
    name: "",
    username: "",
    password: "",
    url: "",
    note: "",
    group_id: "null",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");

  // Stores
  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );
  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  // Update Logo when URL changes
  useEffect(() => {
    if (passwordData.url) {
      setLogoUrl(getLogoUrl(passwordData.url));
    } else {
      setLogoUrl("");
    }
  }, [passwordData.url]);

  // Handlers
  const handleInputChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setDisplayMode("none");
  };

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const generateGroup = () => {
      let group = "";
      for (let i = 0; i < 6; i++) {
        group += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return group;
    };
    const newPassword = `${generateGroup()}-${generateGroup()}-${generateGroup()}`;
    handleInputChange("password", newPassword);
    toast.success("Mot de passe fort généré");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const finalAesKey: string | null = currentOrganization
      ? currentOrganization.decrypted_aes_key
      : aesKey;

    if (!finalAesKey) {
      toast.error("Clé de chiffrement manquante. Veuillez vous reconnecter.");
      return;
    }

    setIsLoading(true);
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
        toast.success("Nouvel élément sécurisé !");
        setDisplayMode("none");
      } else {
        throw new Error(itemCreateError.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white md:bg-[#F9F9FB]">
      {/* --- HEADER (Sticky Actions) --- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-neutral-500 hover:text-neutral-900 md:hidden"
          >
            <ArrowLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-neutral-500 hover:text-neutral-900 hidden md:flex"
          >
            <X size={20} />
          </Button>
          <span className="text-sm font-semibold text-neutral-900">
            Nouvel élément
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || !passwordData.name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Save size={14} />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* IDENTITY CARD */}
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden p-2">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  width={64}
                  height={64}
                  alt="Logo preview"
                  className="object-contain"
                  onError={() => setLogoUrl("")}
                />
              ) : (
                <Globe2 className="w-8 h-8 text-neutral-300" />
              )}
            </div>

            <div className="flex-1 pt-1 space-y-3">
              <div>
                <Input
                  autoFocus
                  placeholder="Nom du service (ex: Netflix)"
                  value={passwordData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="text-xl font-bold h-12 bg-white"
                />
              </div>
              <div>
                <Input
                  placeholder="Site Web (ex: netflix.com)"
                  value={passwordData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  className="bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* CREDENTIALS FORM */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-6">
            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Identifiant
              </Label>
              <Input
                placeholder="Email ou nom d'utilisateur"
                value={passwordData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>

            <Separator className="opacity-50" />

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Mot de passe
                </Label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <RefreshCw size={12} /> Générer fort
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={passwordData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* EXTRA INFO */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-6">
            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Notes
              </Label>
              <Textarea
                placeholder="Ajouter des notes, codes PIN, questions de sécurité..."
                value={passwordData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                className="min-h-[100px] bg-neutral-50/50 resize-y"
              />
            </div>

            {/* Group Selection (Org Only) */}
            {currentOrganization && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Partage
                </Label>
                <Select
                  disabled={isLoading}
                  value={passwordData.group_id}
                  onValueChange={(value) =>
                    handleInputChange("group_id", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner l'accès" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-neutral-500" />
                        <span>Toute l'organisation</span>
                      </div>
                    </SelectItem>
                    {orgGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-indigo-500" />
                          <span>{group.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-neutral-400 pt-1">
                  Définit qui aura accès à cet élément au sein de{" "}
                  {currentOrganization.id ? "l'organisation" : "votre espace"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
