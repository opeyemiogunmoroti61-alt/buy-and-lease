import ProtectedRouteWithRole from "@/components/ProtectedRouteWithRole";
import ControlNav from "@/components/control/ControlNav";

export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRouteWithRole>
      <div className="min-h-screen bg-slate-50">
        <ControlNav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </ProtectedRouteWithRole>
  );
}
