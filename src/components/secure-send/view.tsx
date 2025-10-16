"use client";
import { ArrowLeft, Eye, Key, Send, Trash } from "lucide-react";
import React, { useState } from "react";
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
} from "../ui/alert-dialog";

export default function ViewSecureNote({
  setActiveModal,
  selectedSecureSend,
  copyToClipboard,
  deleteSecureSend,
}: any) {
  const [showPassword, setShowPassword] = useState(false);

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
            {selectedSecureSend.type === "text" ? (
              <Send className="size-8" />
            ) : (
              <Key className="size-8" />
            )}
          </div>
          <div className="flex flex-col gap-1 w-full">
            <div className="text-xl py-1 rounded-lg w-full">
              {selectedSecureSend.name}
            </div>
            <Separator />
            <p className="text-sm text-neutral-500">
              Created at : {selectedSecureSend.created_at_clean}
            </p>
          </div>
        </div>

        {selectedSecureSend.type === "text" ? (
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-4">
            <Label>Text content</Label>
            <div className="rounded-lg text-sm w-full p-2 min-h-[100px]">
              {selectedSecureSend.text}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2">
              <div className="grid grid-cols-5 w-full">
                <Label className=" col-span-2">Username</Label>
                <div className="relative col-span-3">
                  <input
                    readOnly
                    className={`p-2 rounded-lg w-full !outline-none `}
                    value={selectedSecureSend.username}
                    type="text"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-5 w-full">
                <Label className=" col-span-2">Password</Label>
                <div className="relative col-span-3">
                  <input
                    readOnly
                    className={`p-2 rounded-lg w-full !outline-none `}
                    value={selectedSecureSend.password}
                    type={showPassword ? "text" : "password"}
                  />
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    variant="ghost"
                  >
                    <Eye />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-5 w-full">
                <Label className=" col-span-2">Website URL</Label>
                <div className="relative col-span-3">
                  <input
                    readOnly
                    className={`p-2 rounded-lg w-full !outline-none `}
                    type="text"
                    placeholder=""
                    value={selectedSecureSend.url}
                  />
                </div>
              </div>
            </div>
            <div className="bg-white border border-border  rounded-xl p-4 flex flex-col gap-4">
              <Label>Notes</Label>
              <div className="relative">
                <textarea
                  readOnly
                  className={`rounded-lg w-full !outline-none `}
                  value={selectedSecureSend.note}
                />
              </div>
            </div>
          </>
        )}

        <div className=" w-full grid grid-cols-2 gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="" size="lg" variant="destructive">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  secure send.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex items-center gap-2">
                <AlertDialogCancel asChild>
                  <Button variant="ghost">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteSecureSend()} asChild>
                  <Button>
                    <Trash />
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={() => copyToClipboard(selectedSecureSend.link)}
            variant="outline"
            size="lg"
            className=""
          >
            Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}
