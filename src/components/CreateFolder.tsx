"use client";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/client";

const encryptText = (text: any, key: any, iv: any) => {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key, "base64"), iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Retourner l'IV et le texte chiffré ensemble
  return encrypted;
};

const decryptText = (encryptedText: any, key: any, iv: any) => {
  const decipher = createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "base64"),
    Buffer.from(iv, "base64")
  );

  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export function CreateFolder() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Create Folder</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Enter the details for your new folder.
            </DialogDescription>
          </DialogHeader>
          <FolderForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Create Folder</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Create Folder</DrawerTitle>
          <DrawerDescription>
            Enter the details for your new folder.
          </DrawerDescription>
        </DrawerHeader>
        <FolderForm className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FolderForm({ className }: React.ComponentProps<"form">) {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const iv = randomBytes(16);
    // const ivBase64 = iv.toString('base64');
    const ivArray = Array.from(iv);

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const aesKey = localStorage.getItem("aes-key");
    const encryptedData = {
      name: encryptText(data.name, aesKey, iv),
      iv: ivArray,
    };

    const supabase = createClient();
    const { data: itemCreated } = await supabase
      .from("folders")
      .insert([encryptedData]);

    const dataDecrypted = {
      name: decryptText(encryptedData.name, aesKey, iv),
    };
  };

  return (
    <form
      className={cn("grid items-start gap-4", className)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Folder Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Enter password name"
        />
      </div>
      <Button type="submit">Save Password</Button>
    </form>
  );
}
