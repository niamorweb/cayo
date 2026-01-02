"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import CardDisplay from "@/components/global/card-display";

// --- Typage des membres ---
interface OrgMember {
  id: string; // Changé en string pour cohérence avec deleteMember(member.id)
  user_id: string;
  email: string;
  role: "admin" | "manager" | "user";
  has_accepted: boolean;
}

export default function ManageMembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [membersList, setMembersList] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const fetchOrganizationMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching members");
      }

      const data = await response.json();
      setMembersList(data.members as OrgMember[]);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  }, [orgId]);

  useEffect(() => {
    fetchOrganizationMembers();
  }, [fetchOrganizationMembers]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/org/${orgId}/member/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          action: "role",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error updating role");
        return;
      }

      toast.success("Role updated successfully!");
      setMembersList((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? { ...member, role: newRole as OrgMember["role"] }
            : member
        )
      );
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Network error");
    }
  };

  const deleteMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/org/${orgId}/member/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error removing member");
        return;
      }

      toast.success("Member removed successfully!");
      setMembersList((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentUser = (memberId: string) =>
    currentOrganization?.organization_member_id === memberId;

  return (
    <CardDisplay
      href={"/s/org/" + orgId + "/settings"}
      title="Manage members"
      description="Manage members in your organization"
    >
      {membersList.length > 0 ? (
        <div className="space-y-2">
          {membersList.map((member) => (
            <div
              key={member.id}
              className={`hover:bg-neutral-100 duration-150 rounded-2xl flex items-center p-3 justify-between border border-transparent ${
                isCurrentUser(member.id)
                  ? "bg-neutral-50 border-neutral-200"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-neutral-900">
                  {member.email}
                </div>
                {!member.has_accepted && (
                  <div className="px-2 w-fit py-0.5 flex items-center gap-1.5 rounded-full text-[10px] text-orange-600 outline outline-orange-600/20 bg-orange-50 font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Pending
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentOrganization?.user_role === "admin" && (
                  <Select
                    disabled={isCurrentUser(member.id) || isLoading}
                    onValueChange={(newRole) =>
                      handleRoleChange(member.id, newRole)
                    }
                    value={member.role}
                  >
                    <SelectTrigger className="w-[110px] h-9">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {isCurrentUser(member.id) ? (
                  <div className="w-10 flex justify-center text-[10px] font-bold text-neutral-400 uppercase">
                    You
                  </div>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        <LogOut size={18} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          remove <b>{member.email}</b> from your organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteMember(member.id)}
                        >
                          Yes, remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-neutral-500">
          No members found
        </div>
      )}
    </CardDisplay>
  );
}
