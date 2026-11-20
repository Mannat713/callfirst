import type { Metadata } from "next";
import { LeadApp } from "@/components/app/LeadApp";

export const metadata: Metadata = {
  title: "Rank your leads",
  description: "Upload a lead export and get a ranked call list with reasons. Runs in your browser.",
  alternates: { canonical: "/app" },
};

export default function AppPage() {
  return <LeadApp />;
}
