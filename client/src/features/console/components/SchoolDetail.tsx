"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Eye, Pause, Play, Save } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { PageHeader } from "@/components/shared/PageHeader";
import { useUrlParam } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import { moduleName } from "@/lib/modules";
import { useAppDispatch } from "@/store/hooks";
import { viewingAs } from "@/store/sessionSlice";
import {
  errorMessage,
  useGetBranchesQuery,
  useGetTenantsQuery,
  useLogViewAsMutation,
  useSetTenantModulesMutation,
  useSetTenantSeatsMutation,
  useSetTenantStatusMutation,
} from "@/store/api";
import type { ModuleKey, Tenant } from "@/types";
import { DEMO_TENANT_ID } from "@/mocks/tenants";
import { ModulePicker, TenantStatusBadge } from "./shared";
import { useSeatsUsed } from "./useSeatsUsed";

export function SchoolDetail({ tenantId }: { tenantId: string }) {
  const { data: tenants } = useGetTenantsQuery();
  const tenant = tenants?.find((t) => t.id === tenantId);
  if (!tenants) return null;
  if (!tenant) {
    return (
      <Card className="py-0">
        <EmptyState icon={Building2} title="We couldn't find this school" description="It may have been removed." action={<ButtonLink href="/console">Back to schools</ButtonLink>} />
      </Card>
    );
  }
  return <SchoolView key={tenant.id} tenant={tenant} />;
}

function SchoolView({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const seatsUsed = useSeatsUsed()(tenant.id);
  const { data: branches = [] } = useGetBranchesQuery();
  const campuses = branches.filter((b) => (b.tenantId ?? DEMO_TENANT_ID) === tenant.id);
  const [created] = useUrlParam("created", "");
  const [setModules, { isLoading: savingModules }] = useSetTenantModulesMutation();
  const [setSeats, { isLoading: savingSeats }] = useSetTenantSeatsMutation();
  const [setStatus, { isLoading: savingStatus }] = useSetTenantStatusMutation();
  const [logViewAs] = useLogViewAsMutation();
  const [modules, setDraftModules] = useState<ModuleKey[]>(tenant.modules);
  const [note, setNote] = useState<string | null>(null);
  const [seats, setSeatsDraft] = useState(String(tenant.studentSeats));
  const [actionNotice, setNotice] = useState<{ success?: string; error?: string }>({});
  // The URL updates just after this page mounts, so read ?created on every render.
  const notice = actionNotice.success || actionNotice.error ? actionNotice : created ? { success: `${tenant.name} created. The owner's sign-in link went to ${tenant.owner.email}.` } : {};
  const [confirmOff, setConfirmOff] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const turnedOff = tenant.modules.filter((k) => !modules.includes(k));
  const changed = modules.join() !== tenant.modules.join();
  const act = async (result: Promise<{ data?: unknown; error?: unknown }>, success: string) => {
    const r = await result;
    setNotice("error" in r && r.error ? { error: errorMessage(r.error as never) } : { success });
  };

  const saveModules = () => act(setModules({ id: tenant.id, modules }), `Modules saved for ${tenant.name}.`);
  const viewAsOwner = async () => {
    await logViewAs(tenant.id);
    dispatch(viewingAs({ tenantId: tenant.id, branchId: campuses[0]?.id ?? "br-1" }));
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        meta={<TenantStatusBadge status={tenant.status} />}
        description={`${tenant.city}. Joined ${formatDate(tenant.createdAt.slice(0, 10))}.`}
        actions={
          <>
            {tenant.status === "suspended" ? (
              <Button variant="outline" disabled={savingStatus} onClick={() => act(setStatus({ id: tenant.id, status: "active", reason: "" }), `${tenant.name} is active again.`)}>
                <Play data-icon="inline-start" />
                Reactivate
              </Button>
            ) : (
              <>
                {tenant.status === "trial" ? (
                  <Button variant="outline" disabled={savingStatus} onClick={() => act(setStatus({ id: tenant.id, status: "active", reason: "Trial converted" }), `${tenant.name} is now a paying school.`)}>
                    <CheckCircle2 data-icon="inline-start" />
                    Mark as paid
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => setSuspending(true)}>
                  <Pause data-icon="inline-start" />
                  Suspend
                </Button>
              </>
            )}
            <Button onClick={viewAsOwner}>
              <Eye data-icon="inline-start" />
              View as owner
            </Button>
          </>
        }
      />

      {notice.success || notice.error ? (
        <div className={notice.error ? "" : "rounded-lg border border-success/30 bg-success-tint p-3"}>
          <FormStatus success={notice.success} error={notice.error} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="gap-5 px-5 sm:px-6 lg:col-span-2">
          <div>
            <CardTitle>
              <h2>Modules</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">The school sees only these. Turning a module off hides its screens but keeps its data.</CardDescription>
          </div>
          <ModulePicker idPrefix="school" value={modules} onChange={setDraftModules} onNote={setNote} />
          {note ? (
            <p className="text-sm text-muted-foreground" role="status">
              {note}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {changed ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDraftModules(tenant.modules);
                  setNote(null);
                }}
              >
                Undo changes
              </Button>
            ) : null}
            <Button disabled={!changed || modules.length === 0 || savingModules} onClick={() => (turnedOff.length ? setConfirmOff(true) : saveModules())}>
              <Save data-icon="inline-start" />
              Save modules
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="gap-4 px-5 sm:px-6">
            <CardTitle>
              <h2>Seats</h2>
            </CardTitle>
            {tenant.modules.includes("students") ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {seatsUsed.toLocaleString("en-PK")} of {tenant.studentSeats.toLocaleString("en-PK")} student seats used.
                </p>
                <div className="flex items-end gap-2">
                  <TextField id="school-seats" label="Student seats" inputMode="numeric" wrapperClassName="flex-1" value={seats} onChange={(e) => setSeatsDraft(e.target.value.replace(/\D/g, ""))} />
                  <Button variant="outline" disabled={savingSeats || Number(seats) === tenant.studentSeats} onClick={() => act(setSeats({ id: tenant.id, studentSeats: Number(seats) }), `Student seats set to ${Number(seats).toLocaleString("en-PK")}.`)}>
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No student seats: Students and admissions is off.</p>
            )}
          </Card>
          <Card className="gap-3 px-5 sm:px-6">
            <CardTitle>
              <h2>Owner and campus</h2>
            </CardTitle>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd className="font-medium">{tenant.owner.name}</dd>
                <dd className="text-muted-foreground">
                  {tenant.owner.email}
                  {tenant.owner.phone ? `, ${tenant.owner.phone}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{campuses.length === 1 ? "Campus" : "Campuses"}</dt>
                {campuses.map((b) => (
                  <dd key={b.id} className="font-medium">
                    {b.name} <span className="font-normal text-muted-foreground">({b.code})</span>
                  </dd>
                ))}
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Card className="gap-4 px-5 sm:px-6">
        <CardTitle>
          <h2>Activity</h2>
        </CardTitle>
        <ol className="space-y-2 text-sm">
          {[...tenant.history].reverse().map((e, i) => (
            <li key={i} className="border-l-2 border-border pl-3">
              <p>{e.text}</p>
              <p className="text-muted-foreground">
                {new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}, {e.by}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      {confirmOff ? (
        <Dialog open onOpenChange={(o) => !o && setConfirmOff(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Turn off {turnedOff.map(moduleName).join(", ")}?</DialogTitle>
              <DialogDescription>
                {tenant.name} will stop seeing {turnedOff.length === 1 ? "this module" : "these modules"} straight away. The records are kept and come back if you turn {turnedOff.length === 1 ? "it" : "them"} on again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Keep them on</DialogClose>
              <Button
                variant="destructive"
                disabled={savingModules}
                onClick={async () => {
                  setConfirmOff(false);
                  await saveModules();
                }}
              >
                Turn off
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {suspending ? (
        <Dialog open onOpenChange={(o) => !o && setSuspending(false)}>
          <DialogContent>
            <form
              noValidate
              className="flex flex-col gap-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await setStatus({ id: tenant.id, status: "suspended", reason });
                if ("error" in r) return setReasonError(errorMessage(r.error));
                setSuspending(false);
                setReason("");
                setNotice({ success: `${tenant.name} is suspended. Its users see a notice; nothing is deleted.` });
              }}
            >
              <DialogHeader>
                <DialogTitle>Suspend {tenant.name}?</DialogTitle>
                <DialogDescription>Everyone at the school loses access until you reactivate it. Their records are kept.</DialogDescription>
              </DialogHeader>
              <TextField id="suspend-reason" label="Reason" placeholder="e.g. Subscription not renewed" value={reason} onChange={(e) => setReason(e.target.value)} />
              {reasonError ? <FormStatus error={reasonError} /> : null}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                <Button type="submit" variant="destructive" disabled={savingStatus}>
                  Suspend school
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
