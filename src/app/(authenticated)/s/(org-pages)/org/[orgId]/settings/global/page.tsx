"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CardDisplay from "@/components/global/card-display";
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
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const [orgName, setOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name);
    }
  }, [currentOrganization]);

  const submitChangements = async () => {
    const trimmedName = orgName.trim();
    if (!currentOrganization || !trimmedName || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/org/${orgId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "An error occurred");
        return;
      }

      toast.success("Organization updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrg = async () => {
    if (!currentOrganization || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/org/${orgId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete organization");
        return;
      }

      await Promise.allSettled([
        fetchAndStorePasswordsAndFolders(),
        fetchAndDecryptOrganizations(),
      ]);

      toast.success("Organization deleted successfully");
      router.push("/s/vault");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Network error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentOrganization) {
    return <div>Organization not found</div>;
  }

  const trimmedName = orgName.trim();
  const hasChanges = trimmedName && trimmedName !== currentOrganization.name;

  return (
    <CardDisplay
      href={`/s/org/${orgId}/settings`}
      title="Global settings"
      description="Manage your organization settings"
      actionBtns={
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" variant="destructive">
                Delete this organization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently this
                  organizations and all the passwords.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteOrg()}>
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={submitChangements}
            size="lg"
            disabled={isLoading || isDeleting || !hasChanges}
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Organization name"
          disabled={isLoading || isDeleting}
        />
      </div>
    </CardDisplay>
  );
}
