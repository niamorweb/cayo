"use client";
import { Input } from "@/components/ui/input";
import { ChevronRight, Globe, Plus, Search, Trash } from "lucide-react";
import React, { useState } from "react";
import PasswordSelected from "./password-selected";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getLogoUrl } from "@/lib/getLogoUrl";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { toast } from "sonner";
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
import CreatePasswordInterface from "./password-create-interface";
import GlobalLayoutPage from "../global/global-layout-page";
import ItemLeftDisplay from "../global/item-left-display";

export default function PasswordsListSide({
  passwords,
  currentOrganization,
  isTrash,
}: any) {
  const [activeModal, setActiveModal] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedPassword, setSelectedPassword] = useState<any>(null);
  const [isSettingsActive, setIsSettingsActive] = useState(false);
  const [displayCreateInterface, setDisplayCreateInterface] = useState(false);
  const [displayMode, setDisplayMode] = useState<
    "none" | "create-password" | "edit-password"
  >("none");

  const filteredPasswords =
    passwords &&
    passwords?.filter(
      (password: any) =>
        password.name.toLowerCase().includes(search.toLowerCase()) ||
        password.group_name?.toLowerCase().includes(search.toLowerCase()) ||
        password.username?.toLowerCase().includes(search.toLowerCase()) ||
        (password.source === "group" &&
          password.group_name?.includes(search.toLowerCase()))
    );

  const handleDeleteAll = async () => {
    for (let i = 0; i < filteredPasswords.length; i++) {
      await handleDelete(filteredPasswords[i].id);
    }
  };

  const handleDelete = async (passwordId: string) => {
    const response = await fetch("/api/passwords", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passwordId }),
    });

    toast.success("Credential deleted !");
    setSelectedPassword(null);
    setActiveModal(null);
    await fetchAndStorePasswordsAndFolders(true);
    await fetchAndDecryptOrganizations(true);
  };

  return (
    <GlobalLayoutPage
      name={isTrash ? "Trash" : "All passwords"}
      conditionToHide={activeModal}
      actionButton={
        <>
          {isTrash ? (
            (!currentOrganization ||
              currentOrganization.user_role === "admin") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash /> Empty the trash
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. It will permanently delete
                      all credentials from the trash.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex items-center gap-2">
                    <AlertDialogCancel asChild>
                      <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteAll()}
                      asChild
                    >
                      <Button>Delete</Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          ) : (
            // <Button onClick={() => setDisplayMode("create-password")}>
            <button
              onClick={() => setDisplayMode("create-password")}
              className="bg-primary text-white rounded-md p-2 text-left text-sm flex items-center gap-2"
            >
              <Plus className="size-4" /> New credential
            </button>
            // </Button>
          )}
        </>
      }
      leftChildren={
        <>
          <div className="px-3 flex flex-col w-full gap-2 mb-3">
            <div className="flex bg-white items-center gap-3 mt-4">
              <div className="relative flex-1 w-full h-fit">
                <Input
                  onChange={(e) => setSearch(e.target.value)}
                  type="search"
                  className="rounded-xl px-3 pl-10 pr-3 h-12"
                  placeholder={
                    currentOrganization
                      ? "Search credential, username, group name.."
                      : "Search credential, username.."
                  }
                />
                <Search className="absolute size-4 text-black/50 top-1/2 left-4 -translate-y-1/2" />
              </div>
            </div>
          </div>
          <div className="h-auto overflow-auto px-3">
            <div
              className={`overflow-hidden flex flex-col mb-6 ${
                filteredPasswords && filteredPasswords.length > 0 && " "
              }`}
            >
              {filteredPasswords &&
                filteredPasswords
                  .sort((a: any, b: any) =>
                    (a.name || "").localeCompare(b.name || "", undefined, {
                      sensitivity: "base",
                    })
                  )
                  .map((password: any, index: number) => (
                    <ItemLeftDisplay
                      key={index}
                      name={password.name}
                      description={password.username}
                      badge={password.group_name && password.group_name}
                      illustration={
                        password.url ? (
                          <Image
                            src={getLogoUrl(password.url)}
                            width={24}
                            height={24}
                            alt=""
                          />
                        ) : (
                          <Globe className="stroke-[1px]" />
                        )
                      }
                      icon={
                        <ChevronRight className=" absolute top-1/2 right-2 -translate-y-1/2 size-6 stroke-[1px]" />
                      }
                      isItemActive={selectedPassword?.id === password.id}
                      onClick={() => {
                        setSelectedPassword(password);
                        setDisplayMode("edit-password");
                      }}
                    />
                  ))}
              {!isTrash && (
                <button
                  onClick={() => setDisplayMode("create-password")}
                  className=" rounded-xl w-full text-primary flex justify-center items-center gap-3 duration-150 hover:bg-primary/5 h-[96px] "
                >
                  Create a new credential
                  <Plus className="size-6 stroke-[1px]" />
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
              setActiveModal={setActiveModal}
              setDisplayCreateInterface={setDisplayCreateInterface}
              setDisplayMode={setDisplayMode}
            />
          )}
          {displayMode === "edit-password" && selectedPassword && (
            <PasswordSelected
              currentOrganization={currentOrganization}
              selectedPassword={selectedPassword}
              setSelectedPassword={setSelectedPassword}
              setActiveModal={setActiveModal}
              isAlreadyInTrash={isTrash}
            />
          )}
        </>
      }
    />
  );
}
