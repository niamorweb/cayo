"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import CardDisplay from "@/components/global/card-display";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

interface OrgMemberOption {
  value: string;
  label: string;
  user_id: string;
}

interface RawMember {
  id: string;
  email: string;
  user_id: string;
}

export default function Page() {
  const params = useParams();
  const orgId = params.orgId as string;
  const auth = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
  const [multiSelectKey, setMultiSelectKey] = useState(0);

  // Utilisation de useCallback pour stabiliser la fonction
  const fetchOrganizationMembers = useCallback(async () => {
    // Sécurité : on n'exécute pas si l'utilisateur n'est pas authentifié
    if (!auth?.id) return;

    try {
      const response = await fetch(`/api/org/${orgId}/list-members`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching members");
      }

      const data = await response.json();

      // Typage strict ici au lieu de any
      const formattedMembers: OrgMemberOption[] = (data.members as RawMember[])
        .filter((member) => member.user_id !== auth.id) // auth.id est maintenant sûr ici
        .map((member) => ({
          value: member.id,
          label: member.email,
          user_id: member.user_id,
        }));

      setOrgMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  }, [orgId, auth?.id]);

  const createGroup = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/org/${orgId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: trimmedName,
          orgMembersId: selectedMembers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to create group");
        return;
      }

      toast.success("Group created successfully!");

      await fetchAndDecryptOrganizations();

      setName("");
      setSelectedMembers([]);
      setMultiSelectKey((prev) => prev + 1);
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && auth?.id) {
      fetchOrganizationMembers();
    }
  }, [orgId, auth?.id, fetchOrganizationMembers]);

  return (
    <CardDisplay
      href={`/s/org/${orgId}/settings`}
      title="Add a group"
      description="Only invited members can access passwords in this group - organization admins cannot see them."
      actionBtns={
        <>
          <Button variant="outline" size="lg">
            Cancel
          </Button>
          <Button
            onClick={createGroup}
            disabled={!name.trim() || isLoading}
            size="lg"
          >
            {isLoading ? "Creating..." : "Create the group"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="group-name">Group name</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="A name for a group..."
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label>Members</Label>
        <MultiSelect
          key={multiSelectKey}
          options={orgMembers}
          placeholder="Add members to your group..."
          onValueChange={setSelectedMembers}
          defaultValue={[]}
        />
      </div>
    </CardDisplay>
  );
}
