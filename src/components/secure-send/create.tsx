"use client";
import { ArrowLeft, Copy, Send } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CreateSecureNote({
  currentOrganization,
  setActiveModal,
  generateSecureSend,
  setTitle,
  setContent,
  title,
  content,
  generatedLink,
  copyToClipboard,
}: any) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full flex flex-1 justify-center bg-neutral-100 md:w-3/5 md:relative p-4 md:p-8">
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Button
            onClick={() => setActiveModal("")}
            variant="ghost"
            className="md:hidden mr-auto"
          >
            <ArrowLeft /> Back
          </Button>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="bg-neutral-50 rounded-md border border-black/10 h-16 w-16 flex items-center justify-center">
            <Send className="size-8" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <input
              autoFocus
              placeholder="Enter a name"
              className="text-xl py-1 rounded-lg w-full !outline-none bg-neutral-100 px-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={generatedLink}
              type="text"
            />
            <Separator />
            <p className="text-sm text-neutral-500">Secure send</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-4">
          <Label>Text content</Label>
          <textarea
            placeholder="Enter your text-content"
            className="rounded-lg text-sm w-full !outline-none bg-neutral-100 p-2 min-h-[100px]"
            onChange={(e) => setContent(e.target.value)}
            value={content}
            disabled={generatedLink}
          />
        </div>

        {generatedLink ? (
          <Button
            onClick={() => copyToClipboard(generatedLink)}
            className="rounded-xl p-4 h-12"
          >
            <Copy />
            Copy generated link
          </Button>
        ) : (
          <div className=" w-full grid grid-cols-2 gap-4">
            <Button variant="outline" className="rounded-xl p-4 h-12 ">
              Cancel
            </Button>
            <Button
              onClick={() => generateSecureSend()}
              className="rounded-xl p-4 h-12"
            >
              Create secure note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
