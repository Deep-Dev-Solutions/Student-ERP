import { redirect } from "next/navigation";

/** The old wizard address; new papers start at /new. */
export default function GeneratePaperPage() {
  redirect("/teacher-portal/paper-maker/new");
}
