"use client";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

export function AdmissionForm() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Step 1: Student Personal Information */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs ring-1 ring-blue-500/10">
            01
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 1: Student Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Basic demographic, official legal name, and biological details.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              First Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Ahmed"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Khan"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gender <span className="text-rose-500">*</span>
            </label>
            <Select defaultValue="male">
              <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Blood Group
            </label>
            <Select defaultValue="b_pos">
              <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                <SelectValue placeholder="Select Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_pos">A+</SelectItem>
                <SelectItem value="b_pos">B+</SelectItem>
                <SelectItem value="o_pos">O+</SelectItem>
                <SelectItem value="ab_pos">AB+</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Previous School
            </label>
            <Input
              placeholder="e.g. City Grammar School"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Card>

      {/* Step 2: Guardian Details */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs ring-1 ring-indigo-500/10">
            02
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 2: Guardian & Emergency Contacts
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Parental identification and automated WhatsApp fee/attendance notification channel.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Father / Guardian Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Muhammad Raza Khan"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Guardian CNIC / National ID
            </label>
            <Input
              placeholder="35201-XXXXXXX-X"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Alert Number <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="0300-XXXXXXX"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Automated attendance notifications will be sent to this WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Emergency Secondary Phone
            </label>
            <Input
              placeholder="0321-XXXXXXX"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Card>

      {/* Step 3: Academic Assignment & Fee Structure */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs ring-1 ring-emerald-500/10">
            03
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Step 3: Academic Assignment & Fee Structure
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Grade placement, section allocation, and monthly tuition dues.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enrolling Class <span className="text-rose-500">*</span>
            </label>
            <Select defaultValue="9">
              <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Class 9 (Matric)</SelectItem>
                <SelectItem value="10">Class 10 (Matric)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Section Allocation <span className="text-rose-500">*</span>
            </label>
            <Select defaultValue="a">
              <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-medium">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Section A (Morning)</SelectItem>
                <SelectItem value="b">Section B (Morning)</SelectItem>
                <SelectItem value="c">Section C (Evening)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Monthly Tuition Fee (PKR) <span className="text-rose-500">*</span>
            </label>
            <Input
              defaultValue="3000"
              placeholder="3,000"
              className="h-9 rounded-lg border-slate-200 text-xs transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-10 px-5 shadow-xs"
        >
          Save as Draft
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-10 px-6 shadow-xs">
          <PlusCircle className="mr-2 h-4 w-4" />
          Submit & Print Admission Challan
        </Button>
      </div>
    </div>
  );
}

