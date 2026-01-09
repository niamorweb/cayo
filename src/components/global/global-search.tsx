"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Shield,
  Send,
  FileText,
  LogOut,
  Plus,
  Building,
  Inbox,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

// Simuler la récupération des mots de passe (à adapter selon comment tu stockes tes passwords déchiffrés globalement)
// Idéalement, tu devrais avoir un store qui contient les passwords actuels affichés
import { usePasswordStore } from "@/lib/store/passwordStore"; // Supposons que tu aies un store pour les mots de passe

interface GlobalSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function GlobalSearch({ open, setOpen }: GlobalSearchProps) {
  const router = useRouter();

  // Récupération des données pour la recherche
  const organizations = useOrganizationStore((s) => s.organizations);
  const { secureSends } = useSecureSendStore();
  // const { passwords } = usePasswordStore(); // À décommenter si tu as un store global pour les items

  // Gestion de la navigation
  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* --- ACTIONS RAPIDES --- */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/s/create-organization"))
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Organization</span>
          </CommandItem>
          {/* Ajoute d'autres actions globales ici */}
        </CommandGroup>

        {/* --- NAVIGATION --- */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/s/vault"))}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Personal Vault</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/s/secure-send"))}
          >
            <Send className="mr-2 h-4 w-4" />
            <span>Secure Send</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/s/notifications/invitations"))
            }
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>

        {/* --- ORGANIZATIONS --- */}
        {organizations && organizations.length > 0 && (
          <CommandGroup heading="Switch Workspace">
            {organizations.map((org) => (
              <CommandItem
                key={org.id}
                onSelect={() =>
                  runCommand(() => router.push(`/s/org/${org.id}/vault`))
                }
              >
                <Building className="mr-2 h-4 w-4" />
                <span>{org.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* --- SECURE SENDS (Exemple de recherche de contenu) --- */}
        {secureSends && secureSends.length > 0 && (
          <CommandGroup heading="Recent Secure Sends">
            {secureSends.slice(0, 3).map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/s/secure-send?view=${item.id}`)
                  )
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/s/settings/account"))
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              /* Logout Logic */
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
