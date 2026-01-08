"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Grid2X2,
  Loader2,
  Settings2,
  MoreHorizontal,
  Users,
  ChevronsUpDown,
  Check,
  LogOut,
  Save,
  ShieldAlert,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { MultiSelect } from "@/components/ui/multi-select";

// Stores & Logic
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface OrgMemberOption {
  value: string;
  label: string;
  user_id: string;
}
interface GroupMember {
  id: string;
  email: string;
  user_id: string;
  role: string;
}
interface GroupData {
  id: string;
  name: string;
  created_at?: string;
}

// ============================================================================
// SUB-COMPONENT: CREATE GROUP DIALOG
// ============================================================================
const CreateGroupDialog = ({
  orgId,
  authUserId,
  onSuccess,
  open,
  setOpen,
}: {
  orgId: string;
  authUserId?: string;
  onSuccess: () => void;
  open: boolean;
  setOpen: (val: boolean) => void;
}) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);

  // Fetch members for MultiSelect
  useEffect(() => {
    if (open && authUserId) {
      const fetchMembers = async () => {
        try {
          const res = await fetch(`/api/org/${orgId}/list-members`);
          if (!res.ok) return;
          const data = await res.json();
          const formatted = (data.members as any[])
            .filter((m) => m.user_id !== authUserId)
            .map((m) => ({ value: m.id, label: m.email, user_id: m.user_id }));
          setOrgMembers(formatted);
        } catch (e) {
          console.error(e);
        }
      };
      fetchMembers();
    }
  }, [open, orgId, authUserId]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/org/${orgId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: name.trim(),
          orgMembersId: selectedMembers,
        }),
      });
      if (!res.ok) throw new Error();

      await fetchAndDecryptOrganizations();
      toast.success("Group created successfully!");
      setName("");
      setSelectedMembers([]);
      onSuccess();
      setOpen(false);
    } catch {
      toast.error("Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Groups allow you to segregate access to specific passwords.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g. Marketing, Finance..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Add Members (Optional)</Label>
            <MultiSelect
              options={orgMembers}
              placeholder="Select members..."
              onValueChange={setSelectedMembers}
              defaultValue={selectedMembers}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// SUB-COMPONENT: MANAGE GROUP SHEET (SIDE PANEL)
// ============================================================================
const ManageGroupSheet = ({
  group,
  orgId,
  authUserId,
  isOpen,
  onClose,
  onUpdate,
}: {
  group: GroupData | null;
  orgId: string;
  authUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allOrgMembers, setAllOrgMembers] = useState<OrgMemberOption[]>([]);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add Member State
  const [memberToAdd, setMemberToAdd] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Initial Load when sheet opens
  useEffect(() => {
    if (isOpen && group) {
      setNewName(group.name);
      loadData();
    }
  }, [isOpen, group]);

  const loadData = async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      // 1. Get Group Members
      const resGroup = await fetch(
        `/api/org/${orgId}/groups/${group.id}/members`
      );
      if (resGroup.ok) {
        const data = await resGroup.json();
        setMembers(data.group_members);
      }

      // 2. Get All Org Members (for the combo box)
      const resOrg = await fetch(`/api/org/${orgId}/list-members`);
      if (resOrg.ok) {
        const data = await resOrg.json();
        setAllOrgMembers(
          (data.members as any[]).map((m) => ({
            value: m.user_id, // Note: We use user_id for adding to group usually
            label: m.email,
            user_id: m.user_id,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleRename = async () => {
    if (!group || !newName.trim()) return;
    try {
      const res = await fetch(`/api/org/${orgId}/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error();
      toast.success("Group renamed");
      onUpdate();
    } catch {
      toast.error("Rename failed");
    }
  };

  const handleAddMember = async () => {
    if (!group || !memberToAdd) return;
    try {
      const res = await fetch(`/api/org/${orgId}/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberToAdd, role: "member" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Member added");
      setMemberToAdd("");
      loadData(); // Refresh list
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group) return;
    try {
      const res = await fetch(`/api/org/${orgId}/groups/${group.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await fetch(`/api/org/${orgId}/groups/${group.id}`, { method: "DELETE" });
      await fetchAndStorePasswordsAndFolders(true);
      await fetchAndDecryptOrganizations(true);
      toast.success("Group deleted");
      onClose();
      onUpdate();
    } catch {
      toast.error("Failed to delete group");
    }
  };

  // Filter available members (exclude those already in group)
  const availableMembers = allOrgMembers.filter(
    (orgM) => !members.some((groupM) => groupM.user_id === orgM.user_id)
  );

  if (!group) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-co p-4 l h-full">
        <SheetHeader className="mb-6">
          <SheetTitle>Manage Group</SheetTitle>
          <SheetDescription>
            Edit details and manage access for <strong>{group.name}</strong>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-8">
          {/* SECTION 1: RENAME */}
          <div className="space-y-3">
            <Label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
              Group Name
            </Label>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleRename}
                disabled={newName === group.name}
              >
                <Save size={16} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* SECTION 2: MEMBERS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                Group Members ({members.length})
              </Label>
            </div>

            {/* ADD MEMBER INPUT */}
            <div className="flex gap-2">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className="flex-1 justify-between text-neutral-500 font-normal"
                  >
                    {memberToAdd
                      ? allOrgMembers.find((m) => m.value === memberToAdd)
                          ?.label
                      : "Select member to add..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search member..." />
                    <CommandList>
                      <CommandEmpty>No available members.</CommandEmpty>
                      <CommandGroup>
                        {availableMembers.map((member) => (
                          <CommandItem
                            key={member.value}
                            value={member.label}
                            onSelect={() => {
                              setMemberToAdd(
                                member.value === memberToAdd ? "" : member.value
                              );
                              setIsPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                memberToAdd === member.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {member.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleAddMember}
                disabled={!memberToAdd}
                className="bg-indigo-600 text-white"
              >
                Add
              </Button>
            </div>

            {/* MEMBERS LIST */}
            <div className="space-y-2 mt-2">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-neutral-400" />
                </div>
              ) : members.length > 0 ? (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {m.email.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {m.email}
                      </span>
                    </div>
                    {m.user_id !== authUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-neutral-400 hover:text-red-600 h-8 w-8"
                      >
                        <LogOut size={14} />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-neutral-400 border border-dashed rounded-lg">
                  No members in this group yet.
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* SECTION 3: DANGER ZONE */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-auto">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-red-600 w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">
                  Delete Group
                </h4>
                <p className="text-xs text-red-700 mt-1 mb-3">
                  This will permanently delete the group. Items in this group
                  will not be deleted but will lose their group association.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      Delete Group Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteGroup}
                        className="bg-red-600"
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function GroupsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const authUser = useAuthStore((s) => s.user);

  // Store Data
  const organizations = useOrganizationStore((s) => s.organizations);
  const getOrganizationGroups = useOrganizationStore(
    (s) => s.getOrganizationGroups
  );

  const currentOrganization = organizations.find((org) => org.id === orgId);
  const orgGroups = currentOrganization
    ? getOrganizationGroups(currentOrganization.id)
    : [];

  // Local State
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  // Force refresh wrapper
  const refreshGroups = async () => {
    await fetchAndDecryptOrganizations(true);
  };

  const filteredGroups = orgGroups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );
  const isAdmin =
    currentOrganization?.user_role === "admin" ||
    currentOrganization?.user_role === "manager";

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Groups</h2>
          <p className="text-sm text-neutral-500">
            Segment your organization members into teams.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          {isAdmin && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Group
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* --- LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => isAdmin && setSelectedGroup(group)}
              className={cn(
                "group bg-white border border-neutral-200 rounded-xl p-5 shadow-sm transition-all relative overflow-hidden",
                isAdmin
                  ? "cursor-pointer hover:border-indigo-300 hover:shadow-md"
                  : "opacity-80"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Grid2X2 size={20} />
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 text-neutral-400 group-hover:text-indigo-600"
                  >
                    <Settings2 size={16} />
                  </Button>
                )}
              </div>

              <h3 className="font-semibold text-neutral-900 mb-1">
                {group.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Users size={12} />
                <span>Manage members</span>
              </div>

              {/* Decoration Background */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-neutral-50 rounded-full group-hover:bg-indigo-50/50 transition-colors -z-10" />
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/30">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-neutral-100">
              <Grid2X2 className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-base font-medium text-neutral-900">
              No groups found
            </h3>
            <p className="text-sm text-neutral-500 mt-1 mb-4">
              Get started by creating a new group.
            </p>
            {isAdmin && (
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create Group
              </Button>
            )}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <CreateGroupDialog
        open={isCreateOpen}
        setOpen={setIsCreateOpen}
        orgId={orgId}
        authUserId={authUser?.id}
        onSuccess={refreshGroups}
      />

      <ManageGroupSheet
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
        orgId={orgId}
        authUserId={authUser?.id}
        onUpdate={refreshGroups}
      />
    </div>
  );
}
