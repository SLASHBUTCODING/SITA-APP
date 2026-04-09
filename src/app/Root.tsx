import { Outlet } from "react-router";

export function Root() {
  return (
    <div className="w-full h-screen overflow-hidden bg-white flex flex-col">
      <Outlet />
    </div>
  );
}
