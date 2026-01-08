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
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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

// --- Types (Alignés avec ton schema) ---
interface SecureSend {
  id: string;
  name: string;
  text?: string;
  username?: string;
  password?: string;
  url?: string;
  note?: string;
  type: "text" | "password"; // ou autre string
  created_at_clean: string;
  link: string;
}

interface ViewSecureNoteProps {
  setActiveModal: (mode: string) => void;
  selectedSecureSend: SecureSend;
  copyToClipboard: (text: string) => void;
  deleteSecureSend: () => void;
}

// --- Helper Component pour l'affichage propre ---
const ReadOnlyField = ({
  label,
  value,
  isPassword = false,
  onCopy,
}: {
  label: string;
  value?: string;
  isPassword?: boolean;
  onCopy?: () => void;
}) => {
  const [show, setShow] = useState(false);

  if (!value) return null;

  return (
    <div className="space-y-1.5 py-2">
      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-100 rounded-lg group hover:border-neutral-200 transition-colors">
        <div
          className={cn(
            "text-sm text-neutral-800 truncate font-medium flex-1",
            isPassword && !show && "font-mono tracking-widest"
          )}
        >
          {isPassword && !show ? "••••••••••••••••" : value}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPassword && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-neutral-400"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
          )}
          {onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-neutral-400 hover:text-indigo-600"
              onClick={onCopy}
            >
              <Copy size={14} />
            </Button>
          )}
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
  const handleClose = () => setActiveModal("");

  const handleCopyLink = () => {
    copyToClipboard(selectedSecureSend.link);
    toast.success("Lien copié !");
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
            Secure Details
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Secure Send?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The link will immediately stop
                  working for anyone who has it.
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
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 shadow-sm"
          >
            <LinkIcon size={14} /> Copy Link
          </Button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* IDENTITY CARD */}
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-2 text-indigo-500">
              {selectedSecureSend.type === "text" ? (
                <Send size={32} />
              ) : (
                <Key size={32} />
              )}
            </div>

            <div className="flex-1 pt-2 space-y-1">
              <h1 className="text-2xl font-bold text-neutral-900 break-all line-clamp-2">
                {selectedSecureSend.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200 text-xs">
                  <Calendar size={12} /> {selectedSecureSend.created_at_clean}
                </span>
                <span className="text-xs">
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
            <div className="px-6 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <FileText size={14} className="text-neutral-500" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Decrypted Data
              </span>
            </div>

            <div className="p-6">
              {selectedSecureSend.type === "text" ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-mono text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed select-text">
                  {selectedSecureSend.text}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <ReadOnlyField
                    label="Username"
                    value={selectedSecureSend.username}
                    onCopy={() =>
                      copyToClipboard(selectedSecureSend.username || "")
                    }
                  />
                  <Separator className="opacity-50" />
                  <ReadOnlyField
                    label="Password"
                    value={selectedSecureSend.password}
                    isPassword={true}
                    onCopy={() =>
                      copyToClipboard(selectedSecureSend.password || "")
                    }
                  />
                  <Separator className="opacity-50" />
                  <ReadOnlyField
                    label="Website"
                    value={selectedSecureSend.url}
                    onCopy={() => copyToClipboard(selectedSecureSend.url || "")}
                  />
                  {selectedSecureSend.note && (
                    <>
                      <Separator className="opacity-50" />
                      <div className="py-2">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Note
                        </Label>
                        <div className="mt-1 text-sm text-neutral-600 bg-neutral-50 p-2 rounded border border-transparent">
                          {selectedSecureSend.note}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LINK INFO */}
          <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-indigo-900">
                Active Share Link
              </span>
              <span className="text-xs text-indigo-600/80 truncate max-w-[300px] md:max-w-md">
                {selectedSecureSend.link}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleCopyLink}
            >
              <Copy size={14} className="mr-2" /> Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
