"use client";

import React, { useState, useCallback } from "react";
import {
  Plus,
  Send,
  Search,
  ChevronRight,
  FileText,
  FilterX,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { encryptText } from "@/lib/encryption/text";
import { encryptAESKey, generateAESKey } from "@/lib/encryption/aes";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";

import CreateSecureNote from "./create";
import ViewSecureNote from "./view";
import ItemLeftDisplay from "../global/item-left-display";

// --- Interfaces ---
interface SecureSend {
  id: string;
  name: string;
  text: string;
  type: string;
  created_at: string;
  created_at_clean: string;
  link: string;
  encrypted_aes_key: string;
  iv: string;
  salt: string;
  views?: number;
}

type DisplayMode = "list" | "create" | "view";

export default function SecureSendPageLayout() {
  // --- STORE & STATE ---
  const { secureSends, isLoading, fetchSecureSends } = useSecureSendStore();
  const originalAesKey = useAuthStore((s) => s.decryptedAesKey);

  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [selectedSecureSend, setSelectedSecureSend] =
    useState<SecureSend | null>(null);
  const [search, setSearch] = useState("");

  // Form State (Lifted up for persistence or resets)
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  // --- LOGIC ---

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  const generateSecureSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const supabase = createClient();
    const aesKeyItem = generateAESKey();
    const encryptedAesKey = encryptAESKey(aesKeyItem, originalAesKey);
    const iv = Buffer.from(encryptedAesKey.iv, "base64");

    const encryptedData = {
      text: encryptText(content, aesKeyItem, iv),
      name: encryptText(title, aesKeyItem, iv),
      username: encryptText(title, aesKeyItem, iv), // Champ username utilisé comme fallback titre
      iv: encryptedAesKey.iv,
      salt: encryptedAesKey.salt,
      encrypted_aes_key: encryptedAesKey.encryptedKey,
      type: "text",
    };

    const { data, error } = await supabase
      .from("secure_send")
      .insert(encryptedData)
      .select();

    if (error) {
      toast.error("Failed to create secure link");
      return;
    }

    await fetchSecureSends();

    // Génération du lien avec le hash (clé de déchiffrement) qui ne part jamais au serveur
    const link = `${window.location.origin}/secure-send/${data[0].id}#${aesKeyItem}`;
    setGeneratedLink(link);

    toast.success("Secure link ready!");
  };

  const deleteSecureSend = async () => {
    if (!selectedSecureSend) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("secure_send")
      .delete()
      .eq("id", selectedSecureSend.id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }

    await fetchSecureSends();
    setDisplayMode("list");
    setSelectedSecureSend(null);
    toast.success("Deleted successfully");
  };

  const handleCreateNew = () => {
    setGeneratedLink("");
    setTitle("");
    setContent("");
    setDisplayMode("create");
  };

  const handleViewNote = (send: SecureSend) => {
    setSelectedSecureSend(send);
    setDisplayMode("view");
  };

  // Filter Logic
  const filteredSends = secureSends.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- RENDERING VIEWS (FULL WIDTH OVERLAY) ---

  if (displayMode === "create") {
    return (
      <div className="w-full h-full bg-[#F9F9FB] p-6 overflow-y-auto">
        <CreateSecureNote
          generateSecureSend={generateSecureSend}
          setActiveModal={(mode) =>
            setDisplayMode(mode === "" ? "list" : (mode as DisplayMode))
          }
          setTitle={setTitle}
          setContent={setContent}
          title={title}
          content={content}
          generatedLink={generatedLink}
          copyToClipboard={copyToClipboard}
        />
      </div>
    );
  }

  if (displayMode === "view" && selectedSecureSend) {
    return (
      <div className="w-full h-full bg-[#F9F9FB] p-6 overflow-y-auto">
        <ViewSecureNote
          // @ts-ignore
          selectedSecureSend={selectedSecureSend}
          setActiveModal={(mode) =>
            setDisplayMode(mode === "" ? "list" : (mode as DisplayMode))
          }
          copyToClipboard={copyToClipboard}
          deleteSecureSend={deleteSecureSend}
        />
      </div>
    );
  }

  // --- MAIN LIST VIEW ---

  return (
    <div className="flex flex-col h-full bg-[#F9F9FB] w-full text-neutral-900">
      {/* HEADER */}
      <header className="h-16 border-b border-neutral-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search secure sends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-neutral-100 border-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-300 transition-all rounded-lg"
            />
          </div>
        </div>

        <Button onClick={handleCreateNew} variant="default">
          <Send className="w-4 h-4" /> New Transfer
        </Button>
      </header>

      {/* LIST CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6 flex flex-col md:flex-row gap-3 md:gap-1 md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Secure Send
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Share encrypted text or files via a one-time link.
            </p>
          </div>
          <span className="text-sm text-neutral-500 font-mono">
            {filteredSends.length} items
          </span>
        </div>

        {/* LIST CONTAINER */}
        <div className="flex flex-col gap-2 pb-20">
          {isLoading ? (
            // Skeleton Loader
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] w-full bg-white rounded-xl border border-neutral-200 animate-pulse"
              />
            ))
          ) : filteredSends.length > 0 ? (
            filteredSends.map((item, index) => (
              <ItemLeftDisplay
                key={item.id || index}
                name={item.name || "Untitled Note"}
                description={item.created_at_clean}
                // Illustration personnalisée pour Secure Send
                illustration={
                  item.type === "text" ? (
                    <FileText className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Send className="w-5 h-5 text-emerald-500" />
                  )
                }
                icon={
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-400" />
                }
                isItemActive={selectedSecureSend?.id === item.id}
                onClick={() => handleViewNote(item)}
              />
            ))
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <FilterX className="w-6 h-6 opacity-50" />
              </div>
              <p className="font-medium text-neutral-600">
                No secure sends found
              </p>
              <p className="text-sm mt-1">
                Create a new link to start sharing securely.
              </p>
              <Button
                variant="link"
                onClick={handleCreateNew}
                className="mt-2 text-indigo-600"
              >
                Create new
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
