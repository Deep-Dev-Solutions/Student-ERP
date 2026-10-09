"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Sparkles,
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

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Campus & Organization Profile
                </CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <Sparkles className="h-3 w-3" /> Verified Institution
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Update institutional credentials, official branding, and contact channels for public documents & payslips.
              </CardDescription>
            </div>

            <Button
              type="submit"
              form="campus-profile-form"
              disabled={isSaving}
              className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
            >
              {isSaving ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  Saving Profile...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Profile Updated!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form
            id="campus-profile-form"
            onSubmit={handleSave}
            className="space-y-6"
          >
            {/* Campus Logo Section */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Official Campus Crest / Logo
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-blue-600 shadow-xs">
                  <Building2 className="h-9 w-9 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      Upload New Emblem
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: Transparent PNG or SVG (Minimum 400x400px, max 2MB).
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Institutional Identification
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* School Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Institution / Campus Name
                  </label>
                  <Input
                    value={profile.schoolName}
                    onChange={(e) => handleChange("schoolName", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>

                {/* Tagline / Motto */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Motto / Mission Statement
                  </label>
                  <Input
                    value={profile.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Board Registration / Affiliation ID
                  </label>
                  <Input
                    value={profile.registrationNumber}
                    onChange={(e) =>
                      handleChange("registrationNumber", e.target.value)
                    }
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg font-mono"
                  />
                </div>

                {/* Principal Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Principal / Campus Head
                  </label>
                  <Input
                    value={profile.principalName}
                    onChange={(e) =>
                      handleChange("principalName", e.target.value)
                    }
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Contact Channels */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Communication Channels
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="email"
                      value={profile.contactEmail}
                      onChange={(e) =>
                        handleChange("contactEmail", e.target.value)
                      }
                      className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Landline / Hotline
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={profile.contactPhone}
                      onChange={(e) =>
                        handleChange("contactPhone", e.target.value)
                      }
                      className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Institution Portal / Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={profile.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Location */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Physical Campus Address
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Street Address & Campus Block
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={profile.streetAddress}
                      onChange={(e) =>
                        handleChange("streetAddress", e.target.value)
                      }
                      className="pl-9 bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    City
                  </label>
                  <Input
                    value={profile.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Province / State
                  </label>
                  <Input
                    value={profile.province}
                    onChange={(e) => handleChange("province", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Postal Code
                  </label>
                  <Input
                    value={profile.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Country
                  </label>
                  <Input
                    value={profile.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

