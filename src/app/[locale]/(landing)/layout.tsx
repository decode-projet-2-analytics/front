import LandingHeader from "@/components/layout/LandingHeader";
import LandingFooter from "@/components/layout/LandingFooter";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <LandingHeader />
      <main className="flex-1 pt-14">{children}</main>
      <LandingFooter />
    </div>
  );
}
