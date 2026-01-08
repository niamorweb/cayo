"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Pen,
  Save,
  Trash2,
  Undo2,
  X,
  ExternalLink,
  Calendar,
  Shield,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { encryptText } from "@/lib/encryption/text";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { getLogoUrl } from "@/lib/getLogoUrl";
import SharePassword from "../secure-send/action-share-password";
import { cn } from "@/lib/utils";

// --- Interfaces ---
// (Gardées identiques à ton code original pour compatibilité)
interface PasswordData {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  note: string;
  iv: string;
  modified_at: string;
  trash: boolean;
  group_id?: string | null;
  group_name?: string | null;
  email?: string;
  is_own_password?: boolean;
}

interface Organization {
  id: string;
  user_role?: string;
  decrypted_aes_key: string;
}

interface PasswordSelectedProps {
  selectedPassword: PasswordData;
  setSelectedPassword: (pw: PasswordData | null) => void;
  setActiveModal: (val: string | null) => void;
  currentOrganization: Organization | null;
  isAlreadyInTrash?: boolean;
}

// --- SOUS-COMPOSANT CHAMP (Pour éviter la répétition) ---
const DetailField = ({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  onCopy,
  className,
  isPassword = false,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (val: string) => void;
  type?: string;
  onCopy?: () => void;
  className?: string;
  isPassword?: boolean;
}) => {
  const [showPass, setShowPass] = useState(false);
  const displayType = isPassword ? (showPass ? "text" : "password") : type;

  return (
    <div className={cn("group flex flex-col gap-1.5 py-3", className)}>
      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        {label}
      </Label>
      <div className="relative flex items-center">
        {isEditing ? (
          <div className="relative w-full">
            <Input
              type={displayType}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="pr-10 bg-white"
            />
            {isPassword && (
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full h-10 px-3 rounded-md bg-neutral-50/50 border border-transparent hover:border-neutral-200 hover:bg-white transition-all group-hover:shadow-sm">
            <span
              className={cn(
                "text-sm truncate select-all font-medium text-neutral-800",
                isPassword && !showPass && "font-mono tracking-widest"
              )}
            >
              {isPassword && !showPass
                ? "••••••••••••"
                : value || (
                    <span className="text-neutral-400 italic">Vide</span>
                  )}
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isPassword && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              )}
              {value && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-neutral-500 hover:text-primary"
                        onClick={onCopy}
                      >
                        <Copy size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copier</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PasswordSelected({
  selectedPassword,
  setSelectedPassword,
  setActiveModal,
  currentOrganization,
}: PasswordSelectedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalPassword, setOriginalPassword] = useState<PasswordData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );

  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  useEffect(() => {
    setIsEditing(false);
    setLogoError(false);
  }, [selectedPassword.id]);

  const handleInputChange = (field: keyof PasswordData, value: string) => {
    setSelectedPassword({ ...selectedPassword, [field]: value });
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié dans le presse-papier");
    } catch {
      toast.error("Échec de la copie");
    }
  };

  const refreshAppData = async () => {
    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
  };

  const handleSave = async () => {
    const finalAesKey = currentOrganization?.decrypted_aes_key || aesKey;
    if (!finalAesKey) return;

    setIsLoading(true);
    const iv = Buffer.from(selectedPassword.iv, "base64");

    const encryptedData = {
      name: encryptText(selectedPassword.name, finalAesKey, iv),
      username: encryptText(selectedPassword.username, finalAesKey, iv),
      password: encryptText(selectedPassword.password, finalAesKey, iv),
      url: encryptText(selectedPassword.url, finalAesKey, iv),
      note: encryptText(selectedPassword.note, finalAesKey, iv),
      group_id:
        selectedPassword.group_id === "null" ? null : selectedPassword.group_id,
    };

    try {
      await fetch("/api/passwords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordId: selectedPassword.id,
          updates: encryptedData,
        }),
      });
      toast.success("Modifications enregistrées");
      setIsEditing(false);
      await refreshAppData();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/passwords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordId: selectedPassword.id }),
      });
      await refreshAppData();
      toast.success(
        selectedPassword.trash
          ? "Supprimé définitivement"
          : "Mis à la corbeille"
      );
      setActiveModal(null);
      setSelectedPassword(null);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      await fetch("/api/passwords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordId: selectedPassword.id,
          updates: { trash: false },
        }),
      });
      await refreshAppData();
      toast.success("Élément restauré !");
      setActiveModal(null);
      setSelectedPassword(null);
    } catch {
      toast.error("Échec de la restauration");
    }
  };

  const canEdit =
    !currentOrganization ||
    currentOrganization.user_role === "admin" ||
    selectedPassword.is_own_password;

  return (
    <div className="h-full flex flex-col bg-white md:bg-[#F9F9FB]">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setActiveModal(null);
              setSelectedPassword(null);
            }}
            className="text-neutral-500 hover:text-neutral-900"
          >
            <X size={20} />
          </Button>
          <span className="text-sm font-semibold text-neutral-500 hidden md:inline-block">
            Détails
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!selectedPassword.trash && (
            <SharePassword selectedPassword={selectedPassword} />
          )}

          {canEdit &&
            !selectedPassword.trash &&
            (isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPassword(originalPassword!);
                    setIsEditing(false);
                  }}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  <Save size={14} /> Enregistrer
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOriginalPassword(selectedPassword);
                  setIsEditing(true);
                }}
                className="gap-2"
              >
                <Pen size={14} /> Modifier
              </Button>
            ))}
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* IDENTITY CARD */}
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden p-2">
              {selectedPassword.url && !logoError ? (
                <Image
                  src={getLogoUrl(selectedPassword.url)}
                  width={64}
                  height={64}
                  alt="Logo"
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Globe className="w-8 h-8 text-neutral-300" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {isEditing ? (
                <Input
                  value={selectedPassword.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="text-xl font-bold h-10 mb-2"
                  placeholder="Nom du service"
                />
              ) : (
                <h1 className="text-2xl font-bold text-neutral-900 truncate mb-1">
                  {selectedPassword.name}
                </h1>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                {isEditing ? (
                  <Select
                    value={selectedPassword.group_id || "null"}
                    onValueChange={(val) =>
                      setSelectedPassword({
                        ...selectedPassword,
                        group_id: val === "null" ? null : val,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-[180px]">
                      <SelectValue placeholder="Groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Aucun groupe</SelectItem>
                      {orgGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  selectedPassword.group_name && (
                    <Badge
                      variant="secondary"
                      className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200 gap-1 pl-1.5"
                    >
                      <Lock size={10} /> {selectedPassword.group_name}
                    </Badge>
                  )
                )}

                {selectedPassword.url && !isEditing && (
                  <a
                    href={
                      selectedPassword.url.startsWith("http")
                        ? selectedPassword.url
                        : `https://${selectedPassword.url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    {
                      new URL(
                        selectedPassword.url.startsWith("http")
                          ? selectedPassword.url
                          : `https://${selectedPassword.url}`
                      ).hostname
                    }
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* CREDENTIALS BLOCK */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-1">
            <DetailField
              label="Identifiant / Email"
              value={selectedPassword.username}
              isEditing={isEditing}
              onChange={(v) => handleInputChange("username", v)}
              onCopy={() => copyToClipboard(selectedPassword.username)}
            />

            <Separator className="opacity-50" />

            <DetailField
              label="Mot de passe"
              value={selectedPassword.password}
              isEditing={isEditing}
              onChange={(v) => handleInputChange("password", v)}
              onCopy={() => copyToClipboard(selectedPassword.password)}
              isPassword={true}
            />

            <Separator className="opacity-50" />

            <DetailField
              label="Site Web (URL)"
              value={selectedPassword.url}
              isEditing={isEditing}
              onChange={(v) => handleInputChange("url", v)}
              onCopy={() => copyToClipboard(selectedPassword.url)}
            />
          </div>

          {/* NOTES BLOCK */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col gap-3">
            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Notes
            </Label>
            {isEditing ? (
              <Textarea
                value={selectedPassword.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                className="min-h-[120px] bg-neutral-50 resize-y"
                placeholder="Ajouter des notes, codes de sécurité..."
              />
            ) : (
              <div
                className={cn(
                  "text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed p-3 rounded-md bg-neutral-50/50 border border-neutral-100 min-h-[80px]",
                  !selectedPassword.note &&
                    "text-neutral-400 italic flex items-center justify-center"
                )}
              >
                {selectedPassword.note || "Aucune note ajoutée."}
              </div>
            )}
          </div>

          {/* META INFO */}
          <div className="flex items-center justify-between px-2 text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <span
                className="flex items-center gap-1"
                title="Date de modification"
              >
                <Calendar size={12} />{" "}
                {new Date(selectedPassword.modified_at).toLocaleDateString()}
              </span>
              <span
                className="flex items-center gap-1"
                title="Dernière modification par"
              >
                <History size={12} /> {selectedPassword.email || "Moi"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={12} /> AES-256 Encrypted
            </div>
          </div>

          {/* DANGER ZONE (Delete/Restore) */}
          {canEdit && (
            <div className="mt-8 pt-6 border-t border-neutral-200">
              {selectedPassword.trash ? (
                <div className="flex gap-4">
                  <Button
                    onClick={handleRestore}
                    className="flex-1"
                    variant="outline"
                  >
                    <Undo2 className="mr-2 h-4 w-4" /> Restaurer
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        définitivement
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Suppression définitive
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Voulez-vous vraiment
                          supprimer cet élément ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="flex justify-start">
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Mettre à la corbeille
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
