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
import crypto, { createCipheriv, createDecipheriv, randomBytes } from "crypto";
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

export function CreatePassword() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Ajouter un identifiant</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un identifiant</DialogTitle>
            <DialogDescription>
              Enter the details for your new password entry.
            </DialogDescription>
          </DialogHeader>
          <PasswordForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Create Password</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Create Password</DrawerTitle>
          <DrawerDescription>
            Enter the details for your new password entry.
          </DrawerDescription>
        </DrawerHeader>
        <PasswordForm className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function PasswordForm({ className }: React.ComponentProps<"form">) {
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
      username: encryptText(data.username, aesKey, iv),
      password: encryptText(data.password, aesKey, iv),
      url: encryptText(data.url, aesKey, iv),
      note: encryptText(data.note, aesKey, iv),
      iv: ivArray,
    };

    const supabase = createClient();
    const { data: itemCreated } = await supabase
      .from("passwords")
      .insert([encryptedData]);

    const dataDecrypted = {
      name: decryptText(encryptedData.name, aesKey, iv),
      username: decryptText(encryptedData.username, aesKey, iv),
      password: decryptText(encryptedData.password, aesKey, iv),
      url: decryptText(encryptedData.url, aesKey, iv),
      note: decryptText(encryptedData.note, aesKey, iv),
    };
  };

  return (
    <form
      className={cn("grid items-start gap-4", className)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Password Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Enter password name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          type="text"
          id="username"
          name="username"
          placeholder="Enter username"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="Enter password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="url">URL</Label>
        <Input type="url" id="url" name="url" placeholder="Enter URL" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="note">Notes</Label>
        <Textarea id="note" name="note" placeholder="Enter note" />
      </div>
      <Button type="submit">Save Password</Button>
    </form>
  );
}
