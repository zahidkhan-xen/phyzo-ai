import type { Metadata } from "next";
import { AdminBookScreen } from "@/components/admin/AdminBookScreen";

export const metadata: Metadata = {
  title: "Textbook upload",
};

export default function AdminBookPage() {
  return <AdminBookScreen />;
}
