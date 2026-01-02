"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import CardDisplay from "@/components/global/card-display";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { cn } from "@/lib/utils";

// --- Interfaces de types ---

interface OrgMember {
  id: string;
  email: string;
  user_id: string;
}

interface GroupMember extends OrgMember {
  role: string;
}

interface GroupMembersResponse {
  group_members: GroupMember[];
  total: number;
}

interface ComboboxOption {
  value: string;
  label: string;
}

export default function ManageGroupsPage() {
  const authUser = useAuthStore((s) => s.user);
  const params = useParams();
  const orgId = params.orgId as string;

  // States
  const [currentGroup, setCurrentGroup] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<GroupMembersResponse | null>(
    null
  );
  const [formattedOrgMembers, setFormattedOrgMembers] = useState<
    ComboboxOption[]
  >([]);
  const [open, setOpen] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState("");
  const [groupNewName, setGroupNewName] = useState("");

  // Store
  const organizations = useOrganizationStore((s) => s.organizations);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );

  const currentOrganization = organizations.find((org) => org.id === orgId);
  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  // --- Actions API ---

  const fetchOrganizationMembers = async (): Promise<OrgMember[]> => {
    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);
      if (!response.ok) throw new Error("Error fetching members");
      const data = await response.json();
      return data.members as OrgMember[];
    } catch (error) {
      toast.error("Failed to load organization members");
      return [];
    }
  };

  const fetchGroupsMembers = useCallback(async () => {
    if (!currentGroup) return null;
    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`
      );
      if (!response.ok) throw new Error("Error loading group members");
      const result = (await response.json()) as GroupMembersResponse;
      setGroupMembers(result);
      return result;
    } catch (err) {
      toast.error("Network error while loading members");
      return null;
    }
  }, [orgId, currentGroup]);

  const loadMembersData = useCallback(async () => {
    if (!currentGroup) return;

    const groupMembersResponse = await fetchGroupsMembers();
    if (!groupMembersResponse) return;

    const orgMembers = await fetchOrganizationMembers();
    const existingMemberIds = groupMembersResponse.group_members.map(
      (m) => m.user_id
    );

    const availableMembers = orgMembers
      .filter((m) => !existingMemberIds.includes(m.user_id))
      .map((m) => ({
        value: m.user_id,
        label: m.email,
      }));

    setFormattedOrgMembers(availableMembers);
  }, [currentGroup, fetchGroupsMembers, orgId]);

  useEffect(() => {
    if (currentGroup) {
      loadMembersData();
      const selectedGroup = orgGroups.find((g) => g.id === currentGroup);
      setGroupNewName(selectedGroup?.name || "");
    }
  }, [currentGroup, loadMembersData, orgGroups]);

  const renameGroup = async () => {
    if (!groupNewName.trim() || !currentGroup) return;
    try {
      const response = await fetch(`/api/org/${orgId}/groups/${currentGroup}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupNewName }),
      });
      if (!response.ok) throw new Error();
      toast.success("Group renamed");
      await fetchAndDecryptOrganizations(true);
    } catch {
      toast.error("Error renaming group");
    }
  };

  const addMemberToGroup = async () => {
    if (!memberToAdd || !currentGroup) return;
    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: memberToAdd, role: "member" }),
        }
      );
      if (!response.ok) throw new Error();
      toast.success("Member added!");
      setMemberToAdd("");
      await loadMembersData();
    } catch {
      toast.error("Error adding member");
    }
  };

  const deleteMemberGroup = async (userToDeleteId: string) => {
    if (!currentGroup) return;
    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userToDeleteId }),
        }
      );
      if (!response.ok) throw new Error();
      toast.success("Member removed");
      setGroupMembers((prev) =>
        prev
          ? {
              ...prev,
              group_members: prev.group_members.filter(
                (m) => m.id !== userToDeleteId
              ),
              total: prev.total - 1,
            }
          : null
      );
    } catch {
      toast.error("Error removing member");
    }
  };

  const deleteGroup = async () => {
    if (!currentGroup) return;
    try {
      await fetch(`/api/org/${orgId}/groups/${currentGroup}`, {
        method: "DELETE",
      });
      await fetchAndStorePasswordsAndFolders(true);
      await fetchAndDecryptOrganizations(true);
      setCurrentGroup("");
      setGroupMembers(null);
      toast.success("Group deleted!");
    } catch {
      toast.error("Error deleting group");
    }
  };

  return (
    <CardDisplay
      href={`/s/org/${orgId}/settings`}
      title="Manage groups"
      description="Manage your organization groups"
      actionBtns={
        currentGroup && (
          <Button onClick={deleteGroup} size="lg" variant="destructive">
            Delete the group
          </Button>
        )
      }
    >
      <div className="mt-2 mb-6 flex flex-col gap-3">
        <Select value={currentGroup} onValueChange={setCurrentGroup}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {orgGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {groupMembers && currentGroup && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-3 mb-8">
            <Label>Update group name</Label>
            <div className="flex items-center gap-3">
              <Input
                value={groupNewName}
                onChange={(e) => setGroupNewName(e.target.value)}
              />
              <Button onClick={renameGroup} disabled={!groupNewName.trim()}>
                Update
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Members of this group ({groupMembers.total})</Label>
            <div className="flex items-center gap-3 mt-4 mb-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between">
                    {memberToAdd
                      ? formattedOrgMembers.find((m) => m.value === memberToAdd)
                          ?.label
                      : "Add a member..."}
                    <ChevronsUpDown className="opacity-50" size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search a member..." />
                    <CommandList>
                      <CommandEmpty>No members available.</CommandEmpty>
                      <CommandGroup>
                        {formattedOrgMembers.map((member) => (
                          <CommandItem
                            key={member.value}
                            onSelect={() => {
                              setMemberToAdd(
                                member.value === memberToAdd ? "" : member.value
                              );
                              setOpen(false);
                            }}
                          >
                            {member.label}
                            <Check
                              className={cn(
                                "ml-auto",
                                memberToAdd === member.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                              size={16}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button onClick={addMemberToGroup} disabled={!memberToAdd}>
                Add <Plus size={16} />
              </Button>
            </div>

            <div className="space-y-2">
              {groupMembers.group_members.map((member) => (
                <div
                  key={member.id}
                  className="hover:bg-neutral-100 duration-150 rounded-xl flex items-center p-3 justify-between border border-transparent hover:border-neutral-200"
                >
                  <span className="text-sm font-medium">{member.email}</span>
                  {member.user_id !== authUser?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <LogOut size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove this member?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <b>{member.email}</b>{" "}
                            from the group.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMemberGroup(member.id)}
                            className="bg-red-600"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CardDisplay>
  );
}
