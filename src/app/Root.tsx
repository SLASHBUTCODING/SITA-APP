import { Outlet } from "react-router";

export function Root() {
  // Center the phone-shaped portals on tablets/desktops while staying full-bleed on phones.
  // min-h-dvh handles iOS Safari's collapsing toolbar; supports-[height:100dvh] tightens it
  // when available. The inner column tops out at sm breakpoint (~640px).
  return (
    <div className="w-full min-h-dvh bg-neutral-100 flex justify-center">
      <div className="relative w-full max-w-[640px] min-h-dvh overflow-hidden bg-white flex flex-col shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
