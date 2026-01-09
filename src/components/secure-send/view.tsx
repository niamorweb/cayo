"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Trash2,
  X,
  Calendar,
  Link as LinkIcon,
  Send,
  Key,
  Eye,
  EyeOff,
  FileText,
  Check,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";

// --- Types ---
interface SecureSend {
  id: string;
  name: string;
  text?: string;
  username?: string;
  password?: string;
  url?: string;
  note?: string;
  type: "text" | "password";
  created_at_clean: string;
  link: string;
}

interface ViewSecureNoteProps {
  setActiveModal: (mode: string) => void;
  selectedSecureSend: SecureSend;
  copyToClipboard: (text: string) => void;
  deleteSecureSend: () => void;
}

// --- Helper Component Optimisé (Tap-to-Copy) ---
const ReadOnlyField = ({
  label,
  value,
  isPassword = false,
  onCopy,
}: {
  label: string;
  value?: string;
  isPassword?: boolean;
  onCopy?: (text: string) => void;
}) => {
  const [show, setShow] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!value) return null;

  const handleContainerClick = () => {
    if (onCopy) {
      onCopy(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-1.5 py-2">
      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        {label}
      </Label>

      <div
        onClick={handleContainerClick}
        className={cn(
          "relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99]",
          isCopied
            ? "bg-green-50 border-green-200"
            : "bg-neutral-50/50 border-transparent hover:border-neutral-200 hover:bg-white"
        )}
      >
        <div
          className={cn(
            "text-sm font-medium truncate flex-1 mr-8", // mr-8 pour laisser place aux icones
            isCopied ? "text-green-800" : "text-neutral-800",
            isPassword && !show && "font-mono tracking-widest text-xs"
          )}
        >
          {isPassword && !show ? "••••••••••••••••" : value}
        </div>

        <div className="absolute right-2 flex items-center gap-1">
          {isPassword && (
            <div
              className="p-2 text-neutral-400 hover:text-neutral-600 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation(); // Empêche la copie lors du toggle
                setShow(!show);
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          )}

          <div
            className={cn(
              "p-2 transition-colors duration-200",
              isCopied
                ? "text-green-600 scale-110"
                : "text-neutral-300 md:opacity-0 md:group-hover:opacity-100"
            )}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ViewSecureNote({
  setActiveModal,
  selectedSecureSend,
  copyToClipboard,
  deleteSecureSend,
}: ViewSecureNoteProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const handleClose = () => setActiveModal("");

  const handleCopyLink = () => {
    copyToClipboard(selectedSecureSend.link);
    toast.success("Lien de partage copié !");
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyContent = (text: string) => {
    copyToClipboard(text);
    toast.success("Copié !");
  };

  return (
    <div className="h-full flex flex-col bg-white md:bg-[#F9F9FB]">
      {/* --- HEADER (Sticky) --- */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-900 -ml-2 md:ml-0"
          >
            <ArrowLeft size={20} className="md:hidden" />
            <X size={20} className="hidden md:block" />
          </Button>
          <span className="text-sm font-semibold text-neutral-900 hidden md:inline-block">
            Secure Send Details
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
              >
                <Trash2 size={16} className="md:mr-2" />
                <span className="hidden md:inline">Revoke Link</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Secure Send?</AlertDialogTitle>
                <AlertDialogDescription>
                  This link will stop working immediately. The recipient will no
                  longer be able to access the data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteSecureSend}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            onClick={handleCopyLink}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 shadow-sm h-9"
          >
            {linkCopied ? <Check size={14} /> : <LinkIcon size={14} />}
            <span className="hidden md:inline">
              {linkCopied ? "Copied" : "Copy Link"}
            </span>
            <span className="md:hidden">Link</span>
          </Button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">
          {/* IDENTITY CARD */}
          <div className="flex items-start gap-4 md:gap-5">
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-2 text-indigo-500">
              {selectedSecureSend.type === "text" ? (
                <Send size={28} />
              ) : (
                <Key size={28} />
              )}
            </div>

            <div className="flex-1 pt-1 space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 break-all line-clamp-2">
                {selectedSecureSend.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200 text-xs">
                  <Calendar size={12} /> {selectedSecureSend.created_at_clean}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 border border-transparent">
                  {selectedSecureSend.type === "text"
                    ? "Encrypted Note"
                    : "Encrypted Credential"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* MAIN CONTENT BLOCK */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Decrypted Data
                </span>
              </div>
              {selectedSecureSend.type === "text" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-neutral-400 hover:text-indigo-600"
                  onClick={() =>
                    handleCopyContent(selectedSecureSend.text || "")
                  }
                >
                  <Copy size={12} />
                </Button>
              )}
            </div>

            <div className="p-5">
              {selectedSecureSend.type === "text" ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-mono text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed select-text cursor-text">
                  {selectedSecureSend.text}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <ReadOnlyField
                    label="Username"
                    value={selectedSecureSend.username}
                    onCopy={handleCopyContent}
                  />
                  <Separator className="opacity-50 my-2" />
                  <ReadOnlyField
                    label="Password"
                    value={selectedSecureSend.password}
                    isPassword={true}
                    onCopy={handleCopyContent}
                  />
                  <Separator className="opacity-50 my-2" />
                  <ReadOnlyField
                    label="Website"
                    value={selectedSecureSend.url}
                    onCopy={handleCopyContent}
                  />
                  {selectedSecureSend.note && (
                    <>
                      <Separator className="opacity-50 my-2" />
                      <div className="py-2">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Note
                        </Label>
                        <div className="mt-2 text-sm text-neutral-600 bg-amber-50/50 border border-amber-100 p-3 rounded-lg leading-relaxed">
                          {selectedSecureSend.note}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LINK INFO CARD */}
          <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 overflow-hidden">
              <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                <Share2 size={14} /> Active Share Link
              </span>
              <span className="text-xs text-indigo-600/80 truncate font-mono bg-white/50 px-2 py-1 rounded border border-indigo-100/50">
                {selectedSecureSend.link}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
              onClick={handleCopyLink}
            >
              {linkCopied ? <Check size={14} /> : <Copy size={14} />}
              {linkCopied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
