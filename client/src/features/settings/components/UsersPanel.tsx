"use client";

import { useState } from "react";
import { Send, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { useCurrentUser, useTenantBranches } from "@/hooks/use-session";
import { ROLE_LABELS, ROLE_SCOPES } from "@/lib/auth/permissions";
import {
  errorMessage,
  useGetStaffQuery,
  useGetUsersQuery,
  useInviteUserMutation,
  useSetUserStatusMutation,
} from "@/store/api";
import type { Role, User } from "@/types";

const NOT_ON_STAFF = "none";
const ALL_BRANCHES = "all";
/** Roles a school can hand out. Owner is set up with the school, Super-admin belongs to DeepDev. */
const assignableRoles: Role[] = ["branch_admin", "accountant", "front_desk", "teacher"];
/** Roles that may cover every campus. */
const multiBranchRoles: Role[] = ["owner", "accountant"];

const statusBadge: Record<User["status"], { label: string; variant: "success" | "warning" | "neutral" }> = {
  active: { label: "Active", variant: "success" },
  invited: { label: "Invite sent", variant: "warning" },
  disabled: { label: "Access off", variant: "neutral" },
};

export function UsersPanel() {
  const me = useCurrentUser();
  const { data: users = [] } = useGetUsersQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const branches = useTenantBranches();
  const [inviteUser, inviteState] = useInviteUserMutation();
  const [setUserStatus] = useSetUserStatusMutation();

  const [staffId, setStaffId] = useState(NOT_ON_STAFF);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("teacher");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});
  const [tableError, setTableError] = useState<string | null>(null);

  // Staff who don't have a login yet.
  const withLogin = new Set(users.map((u) => u.staffId).filter(Boolean));
  const staffWithoutLogin = staff.filter((s) => !withLogin.has(s.staffId) && s.status !== "terminated");
  const staffOptions = [
    { value: NOT_ON_STAFF, label: "Not on the staff list" },
    ...staffWithoutLogin.map((s) => ({ value: s.staffId, label: `${s.name}, ${s.role}` })),
  ];
  const branchOptions = [
    ...(multiBranchRoles.includes(role) ? [{ value: ALL_BRANCHES, label: "All campuses" }] : []),
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];
  const branchValue = branchOptions.some((o) => o.value === branchId) ? branchId : (branchOptions[0]?.value ?? "");
  const branchName = (ids: string[]) =>
    ids.length === 0 ? "All campuses" : ids.map((id) => branches.find((b) => b.id === id)?.name ?? id).join(", ");

  const pickStaff = (id: string) => {
    setStaffId(id);
    const member = staff.find((s) => s.staffId === id);
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.department === "Administration" ? "front_desk" : "teacher");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setNotice({ error: "Enter a valid email address." });
    const result = await inviteUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      title: ROLE_LABELS[role],
      branchIds: branchValue === ALL_BRANCHES ? [] : [branchValue],
      ...(staffId !== NOT_ON_STAFF ? { staffId } : {}),
    });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `Invite sent to ${result.data.email}. They choose a password from the email.` });
    setStaffId(NOT_ON_STAFF);
    setName("");
    setEmail("");
  };

  const toggleAccess = async (user: User) => {
    const result = await setUserStatus({ id: user.id, status: user.status === "disabled" ? "active" : "disabled" });
    setTableError("error" in result ? errorMessage(result.error) : null);
  };

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Give someone access</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            They get an email to set a password. What they can open depends on their role and campus.
          </CardDescription>
        </div>
        <form onSubmit={handleInvite} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField id="user-staff" label="Staff member" options={staffOptions} value={staffId} onValueChange={pickStaff} hint="Pick from staff without a login, or fill in the details." className="sm:col-span-2 lg:col-span-1" />
            <TextField id="user-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField id="user-email" label="Email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            <SelectField
              id="user-role"
              label="Role"
              options={assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              value={role}
              onValueChange={(v) => setRole(v as Role)}
              hint={`Applies to: ${ROLE_SCOPES[role].toLowerCase()}.`}
            />
            <SelectField id="user-branch" label="Campus" options={branchOptions} value={branchValue} onValueChange={setBranchId} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormStatus success={notice.ok} error={notice.error} />
            <Button type="submit" disabled={!name.trim() || !email.trim() || inviteState.isLoading}>
              <Send data-icon="inline-start" />
              Send invite
            </Button>
          </div>
        </form>
      </Card>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-1 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">People with access</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Turning access off signs the person out and stops them signing in.</p>
          </div>
          {tableError ? <FormStatus error={tableError} /> : null}
        </div>
        {users.length === 0 ? (
          <EmptyState icon={UsersRound} title="No one has access yet" description="Send the first invite above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Campus</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const badge = statusBadge[u.status];
                const locked = u.role === "owner" || u.role === "super_admin" || u.id === me?.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="pl-5 whitespace-normal">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs break-all text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{ROLE_LABELS[u.role]}</p>
                      <Badge variant={badge.variant} className="mt-1 lg:hidden">
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p>{ROLE_LABELS[u.role]}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">{branchName(u.branchIds)}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{branchName(u.branchIds)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {locked ? null : (
                        <Button variant="ghost" size="sm" onClick={() => toggleAccess(u)} aria-label={`${u.status === "disabled" ? "Turn on" : "Turn off"} access for ${u.name}`}>
                          {u.status === "disabled" ? "Turn on" : "Turn off"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
