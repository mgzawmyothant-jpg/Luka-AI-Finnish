import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        className: "bg-slate-900 border border-slate-800 text-slate-100 shadow-xl shadow-black/20",
      }}
    />
  );
}
