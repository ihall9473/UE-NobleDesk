"use client";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  // Changing the key on every route forces React to remount this div,
  // which replays the .page-transition fade+rise animation from globals.css.
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
