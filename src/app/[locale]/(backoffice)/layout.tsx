import BackofficeHeader from "@/components/layout/BackofficeHeader";
import BackofficeFooter from "@/components/layout/BackofficeFooter";

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <BackofficeHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <BackofficeFooter />
    </div>
  );
}
