"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Building2,
  Loader2,
  MailOpen,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";
import { fetchNewOrganizations } from "@/lib/fetchNewOrganizations";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

export default function InvitationsPage() {
  const newOrganizations = useNewOrganizationStore((s) => s.newOrganizations);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // --- ACTIONS ---

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
      toast.success("Welcome! You have joined the organization.");
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
    <div className="space-y-8">
      {/* --- SECTION HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Pending Invitations
        </h2>
        <p className="text-sm text-neutral-500">
          Organizations requesting your participation.
        </p>
      </div>

      <Separator />

      {/* --- CONTENT --- */}
      <div className="flex flex-col gap-4">
        {newOrganizations && newOrganizations.length > 0 ? (
          newOrganizations.map((item) => {
            const key = `${item.organization_id}-${item.organization_member_id}`;
            const isLoading = loadingStates[key];

            return (
              <div
                key={item.organization_member_id}
                className="group bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* INFO GAUCHE */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                      {item.organization_name}
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 bg-neutral-100 text-neutral-500 border-neutral-200"
                      >
                        Member
                      </Badge>
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      Invited you to join their workspace.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400">
                      <CalendarClock size={12} />
                      <span>Awaiting response</span>
                    </div>
                  </div>
                </div>

                {/* ACTIONS DROITE */}
                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  <Button
                    onClick={() =>
                      deleteOrganizationInvite(
                        item.organization_id,
                        item.organization_member_id
                      )
                    }
                    variant="ghost"
                    className="flex-1 md:flex-none text-neutral-500 hover:text-red-600 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    Decline
                  </Button>

                  <Button
                    onClick={() =>
                      updateOrganizationInvite(
                        item.organization_id,
                        item.organization_member_id
                      )
                    }
                    className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm min-w-[120px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Joining...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Accept
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          // --- EMPTY STATE ---
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/30">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-neutral-100">
              <MailOpen className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-base font-medium text-neutral-900">
              No pending invitations
            </h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-xs text-center">
              You are all caught up! Invitations from other organizations will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
