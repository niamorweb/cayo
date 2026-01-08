"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Mail,
  UserPlus,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  FilterX,
  MoreHorizontal,
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
  Select,
  SelectContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Logic & Stores
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { createClient } from "@/lib/supabase/client";
import { encryptAESKey, generateAESKey } from "@/lib/encryption_aes";
import {
  bufferToBase64,
  encryptWithAes,
  encryptWithRsaPublicKey,
  exportKeyToBase64,
  generateRsaKeyPair,
  importAesKeyFromBase64,
} from "@/lib/encryption/rsa";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  role: "admin" | "manager" | "user";
  has_accepted: boolean;
}

// ============================================================================
// SUB-COMPONENT: ADD MEMBER DIALOG
// ============================================================================
const AddMemberDialog = ({
  orgId,
  currentOrganization,
  onSuccess,
  open,
  setOpen,
}: {
  orgId: string;
  currentOrganization: any;
  onSuccess: () => void;
  open: boolean;
  setOpen: (val: boolean) => void;
}) => {
  const [activeTab, setActiveTab] = useState("invite");
  const [isLoading, setIsLoading] = useState(false);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState("");

  // Create State
  const [createData, setCreateData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // LOGIC: Invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      const userResponse = await fetch(`/api/org/${orgId}/invite-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!userResponse.ok) {
        toast.error("User not found in Cayo database.");
        setIsLoading(false);
        return;
      }

      const { id: userId, public_key } = await userResponse.json();

      // Encrypt Org Key with User's Public Key
      const encryptedAesKey = await encryptWithRsaPublicKey(
        currentOrganization.decrypted_aes_key,
        public_key
      );

      const { error } = await supabase.from("organizations_members").insert({
        organization_id: orgId,
        user_id: userId,
        role: "user",
        has_accepted: false,
        encrypted_aes_key: encryptedAesKey,
      });

      if (error) throw error;

      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIC: Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Generate keys for new user
      const aesKeyBase64 = generateAESKey();
      const encryptedAesKey = encryptAESKey(aesKeyBase64, createData.password);
      const aesKey = await importAesKeyFromBase64(aesKeyBase64);
      const keyPair = await generateRsaKeyPair();

      const publicKeyBase64 = await exportKeyToBase64(
        keyPair.publicKey,
        "spki"
      );
      const privateKeyBuffer = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      const { cipher, iv } = await encryptWithAes(privateKeyBuffer, aesKey);

      const profileData = {
        personal_aes_encrypted_key: encryptedAesKey.encryptedKey,
        personal_iv: encryptedAesKey.iv,
        personal_salt: encryptedAesKey.salt,
        rsa_public_key: publicKeyBase64,
        iv_rsa_private_key: bufferToBase64(iv),
        encrypted_rsa_private_key: bufferToBase64(cipher),
      };

      // 2. Encrypt Org Key for new user
      const encryptedOrgAesKey = await encryptWithRsaPublicKey(
        currentOrganization.decrypted_aes_key,
        publicKeyBase64
      );

      const newOrgMemberData = {
        organization_id: orgId,
        role: "user",
        has_accepted: false,
        encrypted_aes_key: encryptedOrgAesKey,
      };

      // 3. API Call
      const response = await fetch(`/api/org/${orgId}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCredential: createData,
          profileData,
          newOrgMemberData,
        }),
      });

      if (!response.ok) throw new Error("API Error");

      toast.success("User created & added!");
      setCreateData({ email: "", password: "" });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error creating user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Grant access to your organization vault.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 border-b border-neutral-100">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-6">
              <TabsTrigger
                value="invite"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-neutral-500 data-[state=active]:text-indigo-600 transition-none"
              >
                Invite via Email
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-neutral-500 data-[state=active]:text-indigo-600 transition-none"
              >
                Create Account
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent
              value="invite"
              className="mt-0 space-y-4 focus-visible:outline-none"
            >
              <div className="bg-indigo-50/50 p-3 rounded-lg flex gap-3 text-xs text-indigo-700">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Use this for people who already have a Cayo account.</p>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleInvite}
                  disabled={isLoading || !inviteEmail}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="create"
              className="mt-0 space-y-4 focus-visible:outline-none"
            >
              <div className="bg-amber-50 p-3 rounded-lg flex gap-3 text-xs text-amber-700">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  You are creating credentials for someone else. Share them
                  securely.
                </p>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Email</Label>
                  <Input
                    placeholder="new.user@company.com"
                    type="email"
                    value={createData.email}
                    onChange={(e) =>
                      setCreateData({ ...createData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Strong password..."
                      value={createData.password}
                      onChange={(e) =>
                        setCreateData({
                          ...createData,
                          password: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={
                      isLoading || !createData.email || !createData.password
                    }
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Create & Add
                  </Button>
                </div>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// MAIN PAGE: MEMBERS LIST
// ============================================================================

export default function MembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- FETCH MEMBERS ---
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMembers(data.members);
    } catch (e) {
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // --- ACTIONS ---
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/org/${orgId}/member/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, action: "role" }),
      });
      if (!res.ok) throw new Error();

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: newRole as any } : m
        )
      );
      toast.success("Role updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/org/${orgId}/member/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredMembers = members.filter((m) =>
    m.email.toLowerCase().includes(search.toLowerCase())
  );
  const isCurrentUser = (id: string) =>
    currentOrganization?.organization_member_id === id;
  const isAdmin = currentOrganization?.user_role === "admin";

  return (
    <div className="space-y-6">
      {/* --- PAGE HEADER & ACTIONS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Team Members
          </h2>
          <p className="text-sm text-neutral-500">Manage access and roles.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          {isAdmin && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* --- MEMBERS TABLE --- */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-neutral-100 bg-neutral-50/50 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <div className="col-span-5 md:col-span-5">User</div>
          <div className="col-span-4 md:col-span-3">Role</div>
          <div className="col-span-3 md:col-span-2">Status</div>
          <div className="col-span-0 md:col-span-2 text-right hidden md:block">
            Actions
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-neutral-400 w-6 h-6" />
            </div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-neutral-50/50 transition-colors group"
              >
                {/* USER INFO */}
                <div className="col-span-5 md:col-span-5 flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0 uppercase">
                    {member.email.substring(0, 2)}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {member.email}
                    </span>
                    {isCurrentUser(member.id) && (
                      <span className="text-[10px] text-neutral-400">
                        Current User
                      </span>
                    )}
                  </div>
                </div>

                {/* ROLE SELECTOR */}
                <div className="col-span-4 md:col-span-3">
                  {isAdmin && !isCurrentUser(member.id) ? (
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val)}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs border-neutral-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-normal capitalize bg-neutral-50 text-neutral-600 border-neutral-200"
                    >
                      {member.role}
                    </Badge>
                  )}
                </div>

                {/* STATUS */}
                <div className="col-span-3 md:col-span-2">
                  {member.has_accepted ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 hover:bg-green-100 border-transparent text-[10px] uppercase tracking-wide"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-transparent text-[10px] uppercase tracking-wide"
                    >
                      Pending
                    </Badge>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="col-span-12 md:col-span-2 flex justify-end">
                  {isAdmin && !isCurrentUser(member.id) && (
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-neutral-600"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Member
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove from organization?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <b>{member.email}</b>? They will lose access to all
                            shared passwords immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMember(member.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirm Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <FilterX className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No members found matching "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD MEMBER DIALOG --- */}
      <AddMemberDialog
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        orgId={orgId}
        currentOrganization={currentOrganization}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
