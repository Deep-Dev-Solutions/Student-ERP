"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Upload,
  CheckCircle2,
  Clock,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { CampusProfileData } from "../types";

const initialCampusData: CampusProfileData = {
  schoolName: "Apex Grammar & Science Academy",
  tagline: "Empowering Next-Generation Leaders Through Knowledge & Character",
  registrationNumber: "REG-EDU-2021-9481",
  contactEmail: "admin@apexgrammar.edu.pk",
  contactPhone: "+92 42 35889900",
  website: "https://www.apexgrammar.edu.pk",
  streetAddress: "Plot 42-B, Sector G, Phase 5, DHA",
  city: "Lahore",
  province: "Punjab",
  postalCode: "54792",
  country: "Pakistan",
  principalName: "Dr. Tariq Mahmood, Ph.D.",
};

export function CampusProfile() {
  const [profile, setProfile] = useState<CampusProfileData>(initialCampusData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoName, setLogoName] = useState<string | null>(null);

  const handleChange = (field: keyof CampusProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 700);
  };

  const field = (key: keyof CampusProfileData, label: string, opts: { span?: string; type?: string; icon?: React.ComponentType<{ className?: string }> } = {}) => {
    const Icon = opts.icon;
    const id = `campus-${key}`;
    return (
      <div className={opts.span}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
        <div className="relative">
          {Icon ? <Icon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /> : null}
          <Input
            id={id}
            type={opts.type ?? "text"}
            value={profile[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className={`h-9 bg-card ${Icon ? "pl-9" : ""}`}
          />
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="gap-6 px-6">
        <div>
          <CardTitle>
            <h2>Campus profile</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            Shown on receipts, payslips, report cards and messages to guardians.
          </CardDescription>
        </div>

        <section aria-labelledby="campus-logo-heading">
          <h3 id="campus-logo-heading" className="mb-2 text-sm font-medium">
            School crest or logo
          </h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
              {logoName ? <ImageIcon aria-hidden className="size-8" /> : <Building2 aria-hidden className="size-8" />}
            </span>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="campus-logo" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                  <Upload data-icon="inline-start" />
                  Upload logo
                </label>
                <input
                  id="campus-logo"
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? null)}
                />
                {logoName ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLogoName(null)}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {logoName ? `Selected ${logoName}` : "PNG or SVG with a transparent background, at least 400 × 400 px, up to 2 MB."}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-5">
          <h3 className="mb-4 text-sm font-semibold">School details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("schoolName", "School name", { span: "sm:col-span-2" })}
            {field("tagline", "Motto", { span: "sm:col-span-2" })}
            {field("registrationNumber", "Board registration number")}
            {field("principalName", "Principal")}
          </div>
        </section>

        <section className="border-t border-border pt-5">
          <h3 className="mb-4 text-sm font-semibold">Contact</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field("contactEmail", "Email", { type: "email", icon: Mail })}
            {field("contactPhone", "Phone", { type: "tel", icon: Phone })}
            {field("website", "Website", { type: "url", icon: Globe })}
          </div>
        </section>

        <section className="border-t border-border pt-5">
          <h3 className="mb-4 text-sm font-semibold">Address</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {field("streetAddress", "Street address", { span: "sm:col-span-2 lg:col-span-4", icon: MapPin })}
            {field("city", "City")}
            {field("province", "Province")}
            {field("postalCode", "Postal code")}
            {field("country", "Country")}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-sm" role="status">
            {saveSuccess ? (
              <span className="flex items-center gap-2 text-success">
                <CheckCircle2 aria-hidden className="size-4" />
                Profile saved.
              </span>
            ) : null}
          </p>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}
