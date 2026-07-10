import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";
import { fetchMe } from "@/lib/userApi";

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchMe();

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <LandingHeader user={me} />
      <main className="min-h-0 flex-1 pt-14">{children}</main>
      <LandingFooter />
    </div>
  );
}
