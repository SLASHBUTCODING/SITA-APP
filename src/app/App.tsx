import { RouterProvider } from "react-router";
import { router } from "./routes";
import { PWAUpdater } from "./PWAUpdater";

export default function App() {
  return (
    <>
      <PWAUpdater />
      <RouterProvider router={router} />
    </>
  );
}
