"use client";

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
import { Button } from "@/components/ui/button";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/useAuthStore";
import CardDisplay from "@/components/global/card-display";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Page() {
  const auth = useAuthStore((s) => s.user);
  const params = useParams();
  const orgId = params.orgId as string;

  const [groupMembers, setGroupMembers] = useState<any>(null);
  const [formattedOrgMembers, setFormattedOrgMembers] = useState<any[]>([]);
  const [currentGroup, setCurrentGroup] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState("");

  const [groupNewName, setGroupNewName] = useState("");

  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const allOrgGroups = useOrganizationStore((s) => s.getOrganizationGroups);
  const orgGroups = currentOrganization && allOrgGroups(currentOrganization.id);

  const fetchOrganizationMembers = async () => {
    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching members");
      }

      const data = await response.json();
      return data.members;
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
      throw error;
    }
  };

  const fetchGroupsMembers = async () => {
    if (!currentGroup) return;

    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`
      );
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Error loading group members");
        return;
      }

      setGroupMembers(result);
      return result;
    } catch (err) {
      console.error("Error:", err);
      toast.error("Network error");
    }
  };

  const loadMembersData = async () => {
    if (!currentGroup) return;

    const groupMembersResponse = await fetchGroupsMembers();
    if (!groupMembersResponse) return;

    const orgMembers = await fetchOrganizationMembers();
    const existingMemberIds = groupMembersResponse.group_members.map(
      (member: any) => member.user_id
    );

    const availableMembers = orgMembers
      .filter((member: any) => !existingMemberIds.includes(member.user_id))
      .map((member: any) => ({
        value: member.user_id,
        label: member.email,
      }));

    setFormattedOrgMembers(availableMembers);
  };

  useEffect(() => {
    if (currentGroup) {
      loadMembersData();

      const selectedGroup = orgGroups?.find((g: any) => g.id === currentGroup);
      setGroupNewName(selectedGroup?.name || "");
    }
  }, [currentGroup]);

  const renameGroup = async () => {
    if (!groupNewName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/org/${orgId}/groups/${currentGroup}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupNewName }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Error renaming group");
        return;
      }

      toast.success("Group renamed successfully");

      await fetchAndDecryptOrganizations(true);
    } catch (error) {
      console.error("Rename error:", error);
      toast.error("Network error while renaming group");
    }
  };

  const addMemberToGroup = async () => {
    if (!memberToAdd) return;

    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: memberToAdd,
            role: "member",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Error adding member");
        return;
      }

      toast.success("Member added!");
      setMemberToAdd("");
      loadMembersData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error");
    }
  };

  const deleteMemberGroup = async (userToDeleteId: string) => {
    try {
      const response = await fetch(
        `/api/org/${orgId}/groups/${currentGroup}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userToDeleteId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Error removing member");
        return;
      }

      toast.success("Member removed from the group!");
      setGroupMembers((prev: any) => ({
        ...prev,
        group_members: prev.group_members.filter(
          (x: any) => x.id !== userToDeleteId
        ),
        total: prev.total - 1,
      }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error");
    }
  };

  const deleteGroup = async () => {
    try {
      const response = await fetch(`/api/org/${orgId}/groups/${currentGroup}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      await fetchAndStorePasswordsAndFolders(true);
      await fetchAndDecryptOrganizations(true);
      setCurrentGroup("");
      setGroupMembers(null);
      toast.success("Group deleted !");
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  };

  return (
    <CardDisplay
      href={"/s/org/" + orgId + "/settings"}
      title="Manage groups"
      description="Manage your organization groups"
      actionBtns={
        currentGroup && (
          <Button onClick={() => deleteGroup()} size="lg" variant="destructive">
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
              {orgGroups?.map((group: any) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {groupMembers?.group_members && groupMembers.total > 0 ? (
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
            <Label>Members of this group</Label>
            <div className="flex items-center gap-3 mt-4 mb-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between"
                  >
                    {memberToAdd
                      ? formattedOrgMembers.find(
                          (member) => member.value === memberToAdd
                        )?.label
                      : "Add a member..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search a member..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No members available.</CommandEmpty>
                      <CommandGroup>
                        {formattedOrgMembers.map((member) => (
                          <CommandItem
                            key={member.value}
                            value={member.value}
                            onSelect={(currentValue) => {
                              setMemberToAdd(
                                currentValue === memberToAdd ? "" : currentValue
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
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button onClick={addMemberToGroup} disabled={!memberToAdd}>
                Add <Plus />
              </Button>
            </div>
            {groupMembers.group_members.map((member: any) => (
              <div
                key={member.id}
                className="hover:bg-neutral-100 duration-150 rounded-2xl flex items-center p-3 justify-between"
              >
                <span className="text-sm">{member.email}</span>
                {member.user_id !== auth.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <LogOut />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          remove this member from the group.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMemberGroup(member.id)}
                        >
                          Yes, remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : currentGroup ? (
        <div>No member found</div>
      ) : null}
    </CardDisplay>
  );
}
