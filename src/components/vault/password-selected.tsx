"use client";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeClosed,
  Globe,
  Pen,
  Trash,
  Undo,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { encryptText } from "@/lib/encryption/text";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import { getLogoUrl } from "@/lib/getLogoUrl";
import { Separator } from "@/components/ui/separator";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { toast } from "sonner";
import SharePassword from "../secure-send/action-share-password";
import { Badge } from "../ui/badge";

export default function PasswordSelected({
  selectedPassword,
  setSelectedPassword,
  setActiveModal,
  currentOrganization,
  isAlreadyInTrash,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalPassword, setOriginalPassword] = useState<any>(null);
  const aesKey = useAuthStore((s) => s.decryptedAesKey);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    setIsEditing(false);
    if (selectedPassword.url) {
      setLogoUrl(getLogoUrl(selectedPassword.url));
    } else {
      setLogoUrl("");
    }
  }, [selectedPassword.id]);

  const handleInputChange = (field: string, value: string) => {
    setSelectedPassword({
      ...selectedPassword,
      [field]: value,
    });
  };

  const handleCancel = () => {
    setSelectedPassword(originalPassword);
    setIsEditing(false);
  };

  const handleDelete = async (passwordId: string) => {
    await fetch("/api/passwords", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passwordId }),
    });

    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
    toast.success("Credential deleted !");
    setSelectedPassword(null);
    setActiveModal(null);
  };

  const handleRestaure = async (passwordId: any) => {
    await fetch("/api/passwords", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passwordId, updates: { trash: false } }),
    });

    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
    toast.success("Credential restaured !");
    setSelectedPassword(null);
    setActiveModal(null);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();

    let finalAesKey = aesKey;
    if (currentOrganization)
      finalAesKey = currentOrganization.decrypted_aes_key;

    // const iv = randomBytes(16);
    //
    // const ivArray = Array.from(iv);
    //
    // const ivNew = Buffer.from(ivArray);
    //
    const iv = Buffer.from(selectedPassword.iv);

    const encryptedData = {
      name: encryptText(selectedPassword.name, finalAesKey, iv),
      username: encryptText(selectedPassword.username, finalAesKey, iv),
      password: encryptText(selectedPassword.password, finalAesKey, iv),
      url: encryptText(selectedPassword.url, finalAesKey, iv),
      note: encryptText(selectedPassword.note, finalAesKey, iv),
      // folder:
      //   selectedPassword.folder === "null" ? null : selectedPassword.folder,
    };

    const response = await fetch("/api/passwords", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        passwordId: selectedPassword.id,
        updates: encryptedData,
      }),
    });

    setLogoUrl(getLogoUrl(selectedPassword.url));

    toast.success("Credential updated !");
    setSelectedPassword(null);
    setActiveModal(null);
    fetchAndStorePasswordsAndFolders();
    fetchAndDecryptOrganizations();
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied !");
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Copied !");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full flex flex-1 justify-center bg-neutral-100 md:w-3/5 md:relative p-4 md:p-8">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="flex items-center justify-between md:justify-end gap-2 ">
          <Button
            onClick={() => {
              setActiveModal(null);
              setSelectedPassword(null);
            }}
            variant="ghost"
            className="md:hidden mr-auto"
          >
            <ArrowLeft /> Back
          </Button>

          {!selectedPassword.trash && (
            <SharePassword selectedPassword={selectedPassword} />
          )}
        </div>
        <div className="bg-white border border-border  rounded-xl p-4 flex items-center gap-4">
          <div className="bg-neutral-50 rounded-md border border-black/10 h-16 w-16 flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                width={100}
                height={100}
                alt=""
                className="size-8"
              />
            ) : (
              <Globe className="size-8" />
            )}
          </div>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <input
                placeholder="Empty"
                disabled={!isEditing}
                className={`text-xl py-1 rounded-lg w-full !outline-none ${
                  isEditing ? "bg-neutral-100 px-2" : ""
                }`}
                value={selectedPassword.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                type="text"
              />
              {selectedPassword.group_name && (
                <Badge>{selectedPassword.group_name}</Badge>
              )}
            </div>
            <Separator />
            <p className="text-sm">
              Last modification : {formatDateTime(selectedPassword.modified_at)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Username</Label>
            <div className="relative col-span-3">
              <input
                placeholder="Empty"
                disabled={!isEditing}
                className={`p-2 rounded-lg w-full !outline-none ${
                  isEditing ? "bg-neutral-100" : ""
                }`}
                value={selectedPassword.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                type="text"
              />
              {!isEditing && (
                <Button
                  onClick={() => copyToClipboard(selectedPassword.username)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  variant="ghost"
                >
                  <Copy />
                </Button>
              )}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Password</Label>
            <div className="relative col-span-3">
              <input
                placeholder="Empty"
                disabled={!isEditing}
                className={`p-2 rounded-lg w-full !outline-none ${
                  isEditing ? "bg-neutral-100" : ""
                }`}
                value={selectedPassword.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                type={isEditing || showPassword ? "text" : "password"}
              />

              {!isEditing && (
                <>
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 top-1/2 -translate-y-1/2"
                    variant="ghost"
                  >
                    {showPassword ? <EyeClosed /> : <Eye />}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(selectedPassword.password)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    variant="ghost"
                  >
                    <Copy />
                  </Button>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 w-full">
            <Label className=" col-span-2">Website URL</Label>
            <div className="relative col-span-3">
              <input
                disabled={!isEditing}
                className={`p-2 rounded-lg w-full !outline-none ${
                  isEditing ? "bg-neutral-100" : ""
                }`}
                type="text"
                placeholder="Empty"
                value={selectedPassword.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
              />
              {!isEditing && (
                <Button
                  onClick={() => copyToClipboard(selectedPassword.url)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  variant="ghost"
                >
                  <Copy />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-border  rounded-xl p-4 flex flex-col gap-4">
          <Label>Notes</Label>
          <div className="relative">
            <textarea
              placeholder="Empty"
              disabled={!isEditing}
              className={`rounded-lg w-full !outline-none ${
                isEditing ? "bg-neutral-100 p-2" : ""
              }`}
              value={selectedPassword.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
            />
            {!isEditing && (
              <Button
                onClick={() => copyToClipboard(selectedPassword.note)}
                className="absolute right-2 top-0"
                variant="ghost"
              >
                <Copy />
              </Button>
            )}
          </div>
        </div>

        {selectedPassword.email && (
          <div className="bg-white border border-border  rounded-xl p-4 flex flex-col gap-4">
            <div className="grid grid-cols-5 w-full">
              <Label className=" col-span-2">Added by</Label>

              <p className="text-sm">{selectedPassword.email}</p>
            </div>
          </div>
        )}
        {currentOrganization ? (
          currentOrganization.user_role === "admin" ||
          selectedPassword.is_own_password ? (
            <>
              {selectedPassword.trash ? (
                <>
                  <Button
                    onClick={() => handleRestaure(selectedPassword.id)}
                    className="rounded-xl p-4 h-12"
                    variant="outline"
                  >
                    <Undo />
                    Restaure
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="rounded-xl p-4 h-12"
                        variant="destructive"
                      >
                        <Trash />
                        Delete permanently
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex items-center gap-2">
                        <AlertDialogCancel asChild>
                          <Button variant="ghost">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selectedPassword.id)}
                          asChild
                        >
                          <Button> Delete</Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : isEditing ? (
                <div className=" flex gap-4">
                  <Button
                    onClick={() => handleCancel()}
                    variant="outline"
                    className="rounded-xl p-4 h-12 w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={(e) => handleSave(e)}
                    className="rounded-xl p-4 h-12 w-1/2"
                  >
                    Save changements
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(true);
                      setOriginalPassword(selectedPassword);
                    }}
                    className="rounded-xl p-4 h-12"
                    variant="outline"
                  >
                    <Pen />
                    Edit
                  </Button>
                  <Button
                    className="rounded-xl p-4 h-12"
                    onClick={() => handleDelete(selectedPassword.id)}
                    variant="destructive"
                  >
                    <Trash />
                    Move to trash
                  </Button>
                </>
              )}
            </>
          ) : null
        ) : (
          <>
            {selectedPassword.trash ? (
              <Button
                onClick={() => handleRestaure(selectedPassword.id)}
                className="rounded-xl p-4 h-12"
                variant="outline"
              >
                <Undo />
                Restaure
              </Button>
            ) : isEditing ? (
              <div className=" flex gap-4">
                <Button
                  onClick={() => handleCancel()}
                  variant="outline"
                  className="rounded-xl p-4 h-12 w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => handleSave(e)}
                  className="rounded-xl p-4 h-12 w-1/2"
                >
                  Save changements
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIsEditing(true);
                  setOriginalPassword(selectedPassword);
                }}
                className="rounded-xl p-4 h-12"
                variant="outline"
              >
                <Pen />
                Edit
              </Button>
            )}{" "}
            {selectedPassword.trash ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="rounded-xl p-4 h-12" variant="destructive">
                    Delete permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex items-center gap-2">
                    <AlertDialogCancel asChild>
                      <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(selectedPassword.id)}
                      asChild
                    >
                      <Button>
                        <Trash />
                        Delete
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                className="rounded-xl p-4 h-12"
                onClick={() => handleDelete(selectedPassword.id)}
                variant="destructive"
              >
                <Trash />
                Move to trash
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
