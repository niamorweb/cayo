"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronRight, Globe, Plus, Search, Trash } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { getLogoUrl } from "@/lib/getLogoUrl";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";

import PasswordSelected from "./password-selected";
import CreatePasswordInterface from "./password-create-interface";
import GlobalLayoutPage from "../global/global-layout-page";
import ItemLeftDisplay from "../global/item-left-display";

// --- Interfaces ---

interface PasswordItem {
  id: string;
  name: string;
  username: string;
  url: string;
  group_name?: string;
  group_id?: string | null;
  source?: "organization" | "group";
  modified_at: string;
}

interface Organization {
  id: string;
  user_role: string;
  decrypted_aes_key: string;
}

interface PasswordsListSideProps {
  passwords: PasswordItem[] | null;
  currentOrganization: Organization | null;
  isTrash: boolean;
}

type DisplayMode = "none" | "create-password" | "edit-password";

export default function PasswordsListSide({
  passwords,
  currentOrganization,
  isTrash,
}: PasswordsListSideProps) {
  const [search, setSearch] = useState("");
  const [selectedPassword, setSelectedPassword] = useState<any>(null); // Type 'any' maintenu ici car PasswordSelected attend une structure complexe déchiffrée
  const [displayMode, setDisplayMode] = useState<DisplayMode>("none");
  const [isLoading, setIsLoading] = useState(false);

  // Filtrage optimisé avec useMemo
  const filteredPasswords = useMemo(() => {
    if (!passwords) return [];
    const s = search.toLowerCase();
    return passwords.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.username.toLowerCase().includes(s) ||
        p.group_name?.toLowerCase().includes(s)
    );
  }, [passwords, search]);

  const handleDeleteAll = async () => {
    setIsLoading(true);
    try {
      for (const pw of filteredPasswords) {
        await fetch("/api/passwords", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passwordId: pw.id }),
        });
      }
      toast.success("Trash emptied successfully!");
      await refreshData();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchAndStorePasswordsAndFolders(true),
      fetchAndDecryptOrganizations(true),
    ]);
  };

  const isAdmin =
    !currentOrganization || currentOrganization.user_role === "admin";

  return (
    <GlobalLayoutPage
      name={isTrash ? "Trash" : "All passwords"}
      conditionToHide={displayMode !== "none"}
      actionButton={
        <>
          {isTrash ? (
            isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isLoading || filteredPasswords.length === 0}
                  >
                    <Trash className="mr-2 h-4 w-4" /> Empty the trash
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all{" "}
                      {filteredPasswords.length} items.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-red-600"
                    >
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          ) : (
            <Button
              onClick={() => setDisplayMode("create-password")}
              className="gap-2"
            >
              <Plus className="size-4" /> New credential
            </Button>
          )}
        </>
      }
      leftChildren={
        <>
          <div className="px-3 flex flex-col w-full gap-2 mb-3">
            <div className="relative mt-4">
              <Input
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl pl-10 h-12"
                placeholder="Search by name, user..."
              />
              <Search className="absolute size-4 text-neutral-400 top-1/2 left-4 -translate-y-1/2" />
            </div>
          </div>

          <div className="h-auto overflow-auto px-3">
            <div className="flex flex-col mb-6 gap-1">
              {filteredPasswords
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((pw) => (
                  <ItemLeftDisplay
                    key={pw.id}
                    name={pw.name}
                    description={pw.username}
                    badge={pw.group_name}
                    illustration={
                      pw.url ? (
                        <Image
                          src={getLogoUrl(pw.url)}
                          width={24}
                          height={24}
                          alt="logo"
                          className="rounded-sm"
                        />
                      ) : (
                        <Globe className="stroke-[1px] text-neutral-400" />
                      )
                    }
                    icon={
                      <ChevronRight className="absolute right-2 size-5 text-neutral-300" />
                    }
                    isItemActive={selectedPassword?.id === pw.id}
                    onClick={() => {
                      setSelectedPassword(pw);
                      setDisplayMode("edit-password");
                    }}
                  />
                ))}

              {!isTrash && filteredPasswords.length > 0 && (
                <button
                  onClick={() => setDisplayMode("create-password")}
                  className="rounded-xl w-full text-primary flex justify-center items-center gap-3 py-8 border-2 border-dashed border-neutral-100 hover:border-primary/20 hover:bg-primary/5 transition-all mt-4"
                >
                  <Plus className="size-5" /> Add another one
                </button>
              )}
            </div>
          </div>
        </>
      }
      mainChildren={
        <>
          {displayMode === "create-password" && (
            <CreatePasswordInterface
              currentOrganization={currentOrganization}
              setDisplayMode={setDisplayMode}
            />
          )}
          {displayMode === "edit-password" && selectedPassword && (
            <PasswordSelected
              currentOrganization={currentOrganization}
              selectedPassword={selectedPassword}
              setSelectedPassword={setSelectedPassword}
              setActiveModal={() => setDisplayMode("none")}
              isAlreadyInTrash={isTrash}
            />
          )}
        </>
      }
    />
  );
}
