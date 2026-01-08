"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Building2,
  Save,
  Trash2,
  AlertTriangle,
  Fingerprint,
  Loader2,
  Copy,
  Users,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useOrganizationStore } from "@/lib/store/organizationStore";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";

// --- ZOD SCHEMA ---
const orgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters."),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function GlobalSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const currentOrganization = useOrganizationStore((s) =>
    s.organizations.find((org) => org.id === orgId)
  );

  const [isDeleting, setIsDeleting] = useState(false);

  // Form Setup
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: "",
    },
  });

  // Sync form with store data
  useEffect(() => {
    if (currentOrganization) {
      form.reset({ name: currentOrganization.name });
    }
  }, [currentOrganization, form]);

  // --- ACTIONS ---

  const onSubmit = async (values: OrgFormValues) => {
    if (!currentOrganization) return;

    // Optimisation: Pas d'appel si le nom n'a pas changé
    if (values.name === currentOrganization.name) {
      toast.info("No changes to save.");
      return;
    }

    try {
      const response = await fetch(`/api/org/${orgId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      });

      if (!response.ok) throw new Error("Update failed");

      // Refresh local data
      await fetchAndDecryptOrganizations();
      toast.success("Organization updated successfully!");
    } catch (error) {
      toast.error("Failed to update organization name.");
    }
  };

  const deleteOrg = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/org/${orgId}/delete`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");

      await Promise.allSettled([
        fetchAndStorePasswordsAndFolders(),
        fetchAndDecryptOrganizations(),
      ]);

      toast.success("Organization deleted");
      router.push("/s/vault");
    } catch (error) {
      toast.error("Could not delete organization. Ensure you are the owner.");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(orgId);
    toast.success("Organization ID copied");
  };

  if (!currentOrganization) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          General Settings
        </h2>
        <p className="text-sm text-neutral-500">
          Manage your workspace identity and billing details.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: MAIN SETTINGS --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Organization Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <Input
                            {...field}
                            className="pl-10 h-11 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting || !form.formState.isDirty
                    }
                    className="bg-neutral-900 hover:bg-neutral-800 text-white min-w-[120px]"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Technical Details */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Technical Details
            </h3>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500 uppercase tracking-wider">
                Organization ID
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    value={orgId}
                    readOnly
                    className="pl-10 font-mono text-xs text-neutral-500 bg-neutral-50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyId}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 text-neutral-500" />
                </Button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Used for API integration or support requests.
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: INFO & DANGER --- */}
        <div className="space-y-6">
          {/* Usage / Plan (Mockup for future) */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <CreditCard size={18} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Current Plan
              </h3>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-neutral-700">
                  Free Tier
                </span>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                  Active
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[20%]" />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                <Users size={10} className="inline mr-1" />
                Usage limit: Unlimited members
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900 font-semibold mb-2">
              Danger Zone
            </AlertTitle>
            <AlertDescription>
              <p className="text-red-800/80 text-xs mb-4 leading-relaxed">
                Deleting this organization will permanently remove all
                passwords, groups, and member associations. This action cannot
                be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white shadow-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Organization
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      <span className="font-bold text-neutral-900">
                        {" "}
                        {currentOrganization.name}{" "}
                      </span>
                      and remove all data associated with it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteOrg}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Deleting..." : "Yes, delete organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
