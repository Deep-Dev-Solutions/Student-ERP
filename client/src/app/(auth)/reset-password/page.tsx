"use client";

import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    // TODO: request a reset link from the API once it exists.
    setSentTo(String(email));
  };

  return (
    <Card className="gap-6 px-6">
      {sentTo ? (
        <div role="status" className="space-y-3 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success-tint text-success">
            <MailCheck aria-hidden className="size-5" />
          </span>
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent a link to
            reset the password.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-semibold">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your school email and we&apos;ll send you a reset link.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input id="reset-email" name="email" type="email" autoComplete="email" required className="h-10 bg-card" />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Send reset link
            </Button>
          </form>
        </>
      )}

      <ButtonLink href="/login" variant="ghost" className="w-full">
        <ArrowLeft data-icon="inline-start" />
        Back to sign in
      </ButtonLink>
    </Card>
  );
}
