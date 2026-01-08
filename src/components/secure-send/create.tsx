"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Send,
  X,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
  Lock,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CreateSecureNoteProps {
  setActiveModal: (mode: string) => void;
  generateSecureSend: () => Promise<void>;
  setTitle: (val: string) => void;
  setContent: (val: string) => void;
  title: string;
  content: string;
  generatedLink: string;
  copyToClipboard: (text: string) => void;
}

export default function CreateSecureNote({
  setActiveModal,
  generateSecureSend,
  setTitle,
  setContent,
  title,
  content,
  generatedLink,
  copyToClipboard,
}: CreateSecureNoteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await generateSecureSend();
    setIsLoading(false);
  };

  const handleCopy = () => {
    copyToClipboard(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClose = () => {
    setActiveModal("");
  };

  return (
    <div className="h-full flex flex-col bg-white md:bg-[#F9F9FB]">
      {/* --- HEADER (Sticky) --- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-900 md:hidden"
          >
            <ArrowLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-900 hidden md:flex"
          >
            <X size={20} />
          </Button>
          <span className="text-sm font-semibold text-neutral-900">
            {generatedLink ? "Link Ready" : "New Secure Send"}
          </span>
        </div>

        {!generatedLink && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isLoading || !title.trim() || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Send size={14} />
              )}
              Create Link
            </Button>
          </div>
        )}
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* SUCCESS STATE (Link Generated) */}
          {generatedLink ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 border-4 border-white shadow-xl">
                <CheckCircle2 size={40} />
              </div>

              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Secure Link Created!
              </h2>
              <p className="text-neutral-500 text-center max-w-md mb-8">
                This link contains your encrypted note. Share it with the
                recipient. The link can only be accessed with the decryption key
                contained in the URL hash.
              </p>

              <div className="w-full bg-white border border-neutral-200 rounded-xl p-2 shadow-sm flex items-center gap-2">
                <div className="h-10 w-10 bg-neutral-50 rounded-lg flex items-center justify-center shrink-0 border border-neutral-100">
                  <LinkIcon size={18} className="text-neutral-400" />
                </div>
                <input
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-transparent text-sm text-neutral-600 outline-none font-mono"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  onClick={handleCopy}
                  className={cn(
                    "gap-2 transition-all",
                    isCopied
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-neutral-900 hover:bg-neutral-800"
                  )}
                >
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="mt-8">
                <Button variant="outline" onClick={handleClose}>
                  Done & Close
                </Button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <>
              {/* Header Card */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-2 text-indigo-500">
                  <Send size={32} />
                </div>

                <div className="flex-1 pt-2 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Title (e.g., WiFi Password for Guest)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-bold h-12 bg-white border-neutral-200 focus:border-indigo-500/50"
                  />
                  <p className="text-xs text-neutral-400 flex items-center gap-1 pl-1">
                    <Lock size={10} /> End-to-end encrypted
                  </p>
                </div>
              </div>

              <Separator />

              {/* Content Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={12} />
                    Secret Content
                  </Label>
                  <Textarea
                    placeholder="Paste your sensitive data here..."
                    className="min-h-[200px] bg-neutral-50/50 resize-y text-base font-mono"
                    onChange={(e) => setContent(e.target.value)}
                    value={content}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
                  <strong>How it works:</strong> We generate a random AES key in
                  your browser. Your text is encrypted locally. The key is added
                  to the link hash (#) and never sent to our servers. Only
                  someone with the full link can decrypt it.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
