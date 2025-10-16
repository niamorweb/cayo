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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import CardDisplay from "@/components/global/card-display";

export default function Page() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [membersList, setMembersList] = useState<any[]>([]);

  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const fetchOrganizationMembers = async () => {
    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching members");
      }

      const data = await response.json();
      setMembersList(data.members);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  };

  useEffect(() => {
    fetchOrganizationMembers();
  }, [orgId]);

  const handleRoleChange = async (memberId: number, newRole: string) => {
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
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Network error");
    }
  };

  const deleteMember = async (memberId: string) => {
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
        membersList.map((member) => (
          <div
            key={member.id}
            className={`hover:bg-neutral-100 duration-150 rounded-2xl flex items-center p-3 justify-between ${
              isCurrentUser(member.id) ? "bg-neutral-50" : ""
            }`}
          >
            <div className="flex flex-col gap-1">
              <div className="text-sm">{member.email}</div>
              {!member.has_accepted && (
                <div className="px-[6px] w-fit py-[2px] flex items-center gap-1 rounded-2xl text-xs text-orange-600 outline outline-orange-600/30 font-medium">
                  <div className="bg-orange-600/10 rounded-full flex items-center justify-center p-[2px]">
                    <div className="size-3 bg-orange-600 rounded-full"></div>
                  </div>
                  Pending
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentOrganization &&
                currentOrganization.user_role === "admin" && (
                  <Select
                    disabled={isCurrentUser(member.id)}
                    onValueChange={(newRole) =>
                      handleRoleChange(member.id, newRole)
                    }
                    value={member.role}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                )}

              {isCurrentUser(member.id) ? (
                <div className="w-10"></div>
              ) : (
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
                        remove this member from your organization.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
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
        ))
      ) : (
        <div>No member found</div>
      )}
    </CardDisplay>
  );
}
