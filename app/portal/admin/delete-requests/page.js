"use client";

import DeleteRequestsView from "@/components/delete-requests/DeleteRequestsView";

export default function AdminDeleteRequestsPage() {
  return <DeleteRequestsView backUrl="/portal/admin/home" titlePrefix="Admin" />;
}
