"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeClosed,
  Globe,
  Lock,
  Pen,
  Trash,
  Undo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { encryptText } from "@/lib/encryption/text";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { getLogoUrl } from "@/lib/getLogoUrl";
import SharePassword from "../secure-send/action-share-password";

// --- Interfaces de types ---

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
  user_role: string;
  decrypted_aes_key: string;
}

interface PasswordSelectedProps {
  selectedPassword: PasswordData;
  setSelectedPassword: (pw: PasswordData | null) => void;
  setActiveModal: (val: string | null) => void;
  currentOrganization: Organization | null;
  isAlreadyInTrash?: boolean;
}

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
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );
  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  useEffect(() => {
    setIsEditing(false);
    setLogoUrl(selectedPassword.url ? getLogoUrl(selectedPassword.url) : "");
  }, [selectedPassword.id, selectedPassword.url]);

  const handleInputChange = (field: keyof PasswordData, value: string) => {
    setSelectedPassword({ ...selectedPassword, [field]: value });
  };

  const handleCancel = () => {
    if (originalPassword) setSelectedPassword(originalPassword);
    setIsEditing(false);
  };

  const refreshAppData = async () => {
    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
  };

  const handleDelete = async (passwordId: string) => {
    setIsLoading(true);
    try {
      await fetch("/api/passwords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordId }),
      });
      await refreshAppData();
      toast.success(
        selectedPassword.trash
          ? "Credential deleted permanently!"
          : "Moved to trash!"
      );
      setSelectedPassword(null);
      setActiveModal(null);
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (passwordId: string) => {
    try {
      await fetch("/api/passwords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordId, updates: { trash: false } }),
      });
      await refreshAppData();
      toast.success("Credential restored!");
      setSelectedPassword(null);
      setActiveModal(null);
    } catch {
      toast.error("Failed to restore");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAesKey = currentOrganization?.decrypted_aes_key || aesKey;
    if (!finalAesKey) return;

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
      toast.success("Credential updated!");
      setIsEditing(false);
      await refreshAppData();
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  const canEdit =
    !currentOrganization ||
    currentOrganization.user_role === "admin" ||
    selectedPassword.is_own_password;

  return (
    <div className="fixed inset-0 z-50 flex flex-1 justify-center bg-neutral-100 md:relative md:w-3/5 p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Button
            onClick={() => {
              setActiveModal(null);
              setSelectedPassword(null);
            }}
            variant="ghost"
            className="md:hidden"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {!selectedPassword.trash && (
            <SharePassword selectedPassword={selectedPassword} />
          )}
        </div>

        {/* Header Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-neutral-50 rounded-lg border border-neutral-200 h-16 w-16 flex items-center justify-center shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                width={32}
                height={32}
                alt="Logo"
                className="rounded-sm"
              />
            ) : (
              <Globe className="text-neutral-400" />
            )}
          </div>
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <div className="flex items-center gap-2">
              <input
                disabled={!isEditing}
                className={`text-xl font-semibold w-full bg-transparent outline-none transition-all ${
                  isEditing
                    ? "bg-neutral-100 px-2 rounded-md ring-1 ring-neutral-200"
                    : ""
                }`}
                value={selectedPassword.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {!isEditing && selectedPassword.group_name && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {selectedPassword.group_name}
                </Badge>
              )}
            </div>
            <Separator />
            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
              Modifié : {formatDateTime(selectedPassword.modified_at)}
            </p>
          </div>
        </div>

        {/* Inputs Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
          {[
            { label: "Identifiant", field: "username" as const, type: "text" },
            {
              label: "Mot de passe",
              field: "password" as const,
              type: showPassword ? "text" : "password",
            },
            { label: "Site Web", field: "url" as const, type: "text" },
          ].map((item, idx) => (
            <React.Fragment key={item.field}>
              <div className="grid grid-cols-5 items-center gap-2">
                <Label className="col-span-2 text-neutral-500">
                  {item.label}
                </Label>
                <div className="relative col-span-3">
                  <input
                    disabled={!isEditing}
                    type={isEditing ? "text" : item.type}
                    className={`text-sm p-2 w-full bg-transparent outline-none transition-all ${
                      isEditing
                        ? "bg-neutral-100 rounded-md ring-1 ring-neutral-200"
                        : ""
                    }`}
                    value={selectedPassword[item.field] || ""}
                    onChange={(e) =>
                      handleInputChange(item.field, e.target.value)
                    }
                  />
                  {!isEditing && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1">
                      {item.field === "password" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeClosed size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(selectedPassword[item.field] || "")
                        }
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {idx < 2 && <Separator />}
            </React.Fragment>
          ))}
        </div>

        {/* Notes Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <Label className="text-neutral-500">Notes</Label>
          <div className="relative">
            <textarea
              disabled={!isEditing}
              className={`text-sm w-full min-h-[100px] bg-transparent outline-none resize-none transition-all ${
                isEditing
                  ? "bg-neutral-100 p-2 rounded-md ring-1 ring-neutral-200"
                  : ""
              }`}
              value={selectedPassword.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
            />
            {!isEditing && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0"
                onClick={() => copyToClipboard(selectedPassword.note)}
              >
                <Copy size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Group / Access Selection */}
        {isEditing && (
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-5 items-center gap-2">
              <Label className="col-span-2 text-neutral-500">Accès</Label>
              <Select
                value={selectedPassword.group_id || "null"}
                onValueChange={(val) =>
                  setSelectedPassword({
                    ...selectedPassword,
                    group_id: val === "null" ? null : val,
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tout le monde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">
                    <div className="flex items-center gap-2">
                      <Globe size={14} /> Organisation
                    </div>
                  </SelectItem>
                  {orgGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        <Lock size={14} /> {g.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col gap-2 mt-4">
          {canEdit ? (
            selectedPassword.trash ? (
              <>
                <Button
                  onClick={() => handleRestore(selectedPassword.id)}
                  className="w-full py-6 rounded-xl"
                  variant="outline"
                >
                  <Undo className="mr-2" /> Restaurer
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full py-6 rounded-xl"
                      variant="destructive"
                    >
                      <Trash className="mr-2" /> Supprimer définitivement
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Suppression définitive
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Les données seront
                        effacées à jamais.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedPassword.id)}
                        className="bg-red-600"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : isEditing ? (
              <div className="flex gap-4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-1/2 py-6 rounded-xl"
                >
                  Annuler
                </Button>
                <Button onClick={handleSave} className="w-1/2 py-6 rounded-xl">
                  Enregistrer
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setOriginalPassword(selectedPassword);
                    setIsEditing(true);
                  }}
                  variant="outline"
                  className="py-6 rounded-xl"
                >
                  <Pen className="mr-2" /> Modifier
                </Button>
                <Button
                  onClick={() => handleDelete(selectedPassword.id)}
                  variant="destructive"
                  className="py-6 rounded-xl"
                >
                  <Trash className="mr-2" /> Mettre à la corbeille
                </Button>
              </>
            )
          ) : (
            <p className="text-center text-xs text-neutral-400">
              Lecture seule (droits administrateur requis)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
