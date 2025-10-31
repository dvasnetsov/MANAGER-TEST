
import { ReactNode } from "react";
export function Card({ children, className = "" }: { children: ReactNode, className?: string }) {
  return <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}
