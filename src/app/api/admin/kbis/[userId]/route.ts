import { getServerRole } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = await getServerRole();
  if (role !== "Admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { userId } = await params;
  const res = await apiFetch(`/admin/users/${userId}/kbis`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response("Not found", { status: res.status });
  }

  const body = await res.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
