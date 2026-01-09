"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  MoreHorizontal,
  Copy,
  Star,
  Globe,
  Filter,
  Trash,
  FilterX,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// --- Interfaces ---
export interface PasswordItem {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  group_name?: string;
  group_id?: string | null;
  source?: "organization" | "group";
  modified_at?: string;
  favorite?: boolean;
}

export interface Organization {
  id: string;
  user_role?: string;
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
  console.log("passwords : ", passwords);

  // --- STATE ---
  const [search, setSearch] = useState("");
  const [selectedPassword, setSelectedPassword] = useState<any>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("none");
  const [isLoading, setIsLoading] = useState(false);

  // --- LOGIC ---
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

  // Fonction pour supprimer un seul item (depuis le tableau)
  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Empêcher l'ouverture du détail
    if (!confirm("Move to trash?")) return;

    try {
      await fetch("/api/passwords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordId: id }),
      });
      toast.success("Item moved to trash");
      await refreshData();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchAndStorePasswordsAndFolders(true),
      fetchAndDecryptOrganizations(true),
    ]);
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isAdmin =
    !currentOrganization || currentOrganization.user_role === "admin";

  // --- RENDERING MODALS/OVERLAYS (FULL WIDTH) ---
  if (displayMode === "create-password") {
    return (
      <div className="w-full h-full bg-[#F9F9FB] p-6 overflow-y-auto">
        <CreatePasswordInterface
          currentOrganization={currentOrganization}
          setDisplayMode={setDisplayMode}
        />
      </div>
    );
  }

  if (displayMode === "edit-password" && selectedPassword) {
    return (
      <div className="w-full h-full bg-[#F9F9FB] p-6 overflow-y-auto">
        <PasswordSelected
          currentOrganization={currentOrganization}
          selectedPassword={selectedPassword}
          setSelectedPassword={setSelectedPassword}
          setActiveModal={() => setDisplayMode("none")}
          isAlreadyInTrash={isTrash}
        />
      </div>
    );
  }

  // --- MAIN VIEW (TABLE) ---
  return (
    <div className="flex flex-col h-full bg-[#F9F9FB] w-full text-neutral-900">
      {/* --- TOP BAR --- */}
      <header className="h-16 border-b border-neutral-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isTrash ? "Search trash..." : "Search vault..."}
              className="pl-9 bg-neutral-100 border-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-300 transition-all rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isTrash && (
            <Button
              variant="outline"
              size="sm"
              className="text-neutral-600 border-neutral-200 hidden md:flex"
            >
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          )}

          {isTrash ? (
            isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isLoading || filteredPasswords.length === 0}
                  >
                    <Trash className="w-4 h-4 mr-2" /> Empty Trash
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all{" "}
                      {filteredPasswords.length} items. This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          ) : (
            <Button
              size="sm"
              className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-500/20"
              onClick={() => setDisplayMode("create-password")}
            >
              <Plus className="w-4 h-4 mr-2" /> New Item
            </Button>
          )}
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="!text-2xl font-bold !tracking-tight text-neutral-900">
            {isTrash ? "Trash Bin" : "All Passwords"}
          </h1>
          <span className="text-sm text-neutral-500">
            {filteredPasswords.length} entries
          </span>
        </div>

        {/* LIST VIEW (Tableau Clean) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden min-h-[200px]">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-neutral-100 bg-neutral-50/50 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            <div className="flex-[2]">Name</div>
            <div className="flex-1 hidden md:block">Username</div>
            <div className="flex-1 hidden md:block">Password</div>
            <div className="flex-1 hidden md:block">Website</div>
            <div className="flex-1 text-right">Actions</div>
          </div>

          {/* Empty State */}
          {filteredPasswords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                {isTrash ? (
                  <Trash className="w-6 h-6 opacity-50" />
                ) : (
                  <FilterX className="w-6 h-6 opacity-50" />
                )}
              </div>
              <p>No items found.</p>
            </div>
          )}

          {/* Rows */}
          <div className="divide-y divide-neutral-100">
            {filteredPasswords
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPassword(item);
                    setDisplayMode("edit-password");
                  }}
                  className="flex items-center gap-4 px-6 py-4 group hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  {/* Name & Icon */}
                  <div className="flex-[2] flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-xs overflow-hidden">
                      {item.url ? (
                        <Image
                          src={getLogoUrl(item.url)}
                          width={24}
                          height={24}
                          alt="Logo"
                          className="object-cover"
                        />
                      ) : (
                        <Globe className="text-neutral-400 w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-neutral-900 truncate">
                        {item.name}
                      </span>
                      {/* Mobile: show username here */}
                      <span className="text-xs text-neutral-500 md:hidden truncate">
                        {item.username}
                      </span>
                    </div>
                  </div>

                  {/* Username (Desktop) */}
                  <div className="flex-1 hidden md:flex items-center text-sm text-neutral-600 overflow-hidden">
                    <span className="truncate max-w-[150px]">
                      {item.username}
                    </span>
                    <button
                      onClick={(e) => copyToClipboard(e, item.username)}
                      className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-indigo-600 transition-all p-1 hover:bg-indigo-50 rounded"
                      title="Copy Username"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Password (Desktop) */}
                  <div className="flex-1 hidden md:flex items-center gap-2 overflow-hidden">
                    {item.password && (
                      <div className="flex items-center gap-2 group/pass">
                        <div className="px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-500 flex items-center gap-1.5 max-w-full">
                          <Lock className="w-3 h-3 shrink-0" />
                          {/* On affiche des points statiques pour masquer visuellement */}
                          <span className="font-mono tracking-widest mt-0.5">
                            ••••••••••
                          </span>
                        </div>

                        {/* Bouton pour copier le vrai mot de passe */}
                        <button
                          onClick={(e) => copyToClipboard(e, item.password)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-indigo-600 transition-all p-1 hover:bg-indigo-50 rounded"
                          title="Copy Password"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Website (Desktop) */}
                  <div className="flex-1 hidden md:flex items-center gap-2 overflow-hidden">
                    {item.url && (
                      <div className="px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-600 flex items-center gap-1 max-w-full truncate">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 md:col-span-2 flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400 hover:text-yellow-500 hidden md:flex"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Star
                        className={
                          item.favorite
                            ? "w-4 h-4 fill-yellow-500 text-yellow-500"
                            : "w-4 h-4"
                        }
                      />
                    </Button> */}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 hover:text-neutral-900"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPassword(item);
                            setDisplayMode("edit-password");
                          }}
                        >
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!item.username}
                          onClick={(e) => copyToClipboard(e, item.username)}
                        >
                          Copy Username
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!item.password}
                          onClick={(e) => copyToClipboard(e, item.password)}
                        >
                          Copy password
                        </DropdownMenuItem>
                        {item.url && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://${item.url}`, "_blank");
                            }}
                          >
                            Launch Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={(e) => handleDeleteSingle(e, item.id)}
                        >
                          {isTrash ? "Delete Forever" : "Move to Trash"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
