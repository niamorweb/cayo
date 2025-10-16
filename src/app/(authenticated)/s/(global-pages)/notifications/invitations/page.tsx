"use client";
import { useState } from "react";
import CardDisplay from "@/components/global/card-display";
import { Button } from "@/components/ui/button";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";
import { fetchNewOrganizations } from "@/lib/fetchNewOrganizations";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function Page() {
  const newOrganizations = useNewOrganizationStore((s) => s.newOrganizations);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const updateOrganizationInvite = async (
    organizationId: string,
    organizationMemberId: string
  ) => {
    const key = `${organizationId}-${organizationMemberId}`;
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `/api/org/${organizationId}/member/${organizationMemberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            has_accepted: true,
            action: "status",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error accepting invitation");
        return;
      }

      await fetchNewOrganizations();
      await fetchAndDecryptOrganizations();
      toast.success("You have joined the organization!");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Network error");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteOrganizationInvite = async (
    organizationId: string,
    organizationMemberId: string
  ) => {
    const key = `${organizationId}-${organizationMemberId}`;
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `/api/org/${organizationId}/member/${organizationMemberId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error declining invitation");
        return;
      }

      await fetchNewOrganizations();
      toast.success("Invitation declined");
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Network error");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <CardDisplay
      href={"/s/notifications"}
      title="Invitations"
      description="Find all your received invitations here."
    >
      {newOrganizations && newOrganizations.length > 0 ? (
        <div className="flex flex-col gap-3">
          {newOrganizations.map((item) => {
            const key = `${item.organization_id}-${item.organization_member_id}`;
            const isLoading = loadingStates[key];

            return (
              <div
                key={item.organization_member_id}
                className="p-4 rounded-lg bg-accent flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.organization_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      updateOrganizationInvite(
                        item.organization_id,
                        item.organization_member_id
                      )
                    }
                    disabled={isLoading}
                  >
                    <Check />
                    Accept
                  </Button>
                  <Button
                    onClick={() =>
                      deleteOrganizationInvite(
                        item.organization_id,
                        item.organization_member_id
                      )
                    }
                    variant="destructive"
                    disabled={isLoading}
                  >
                    <X />
                    Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>No invitations</div>
      )}
    </CardDisplay>
  );
}
