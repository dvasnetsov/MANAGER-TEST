
import { ButtonHTMLAttributes } from "react";
export function Button({ className="", variant="default", size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost", size?: "icon" }) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none border";
  const variants = { default: "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent", outline: "bg-white text-gray-700 hover:bg-gray-50 border-gray-300", ghost: "bg-transparent text-gray-700 hover:bg-gray-100 border-transparent" } as const;
  const sizes = { icon: "h-9 w-9 p-0", default: "h-9 px-3" } as const;
  return <button className={`${base} ${variants[variant]} ${size==="icon"?sizes.icon:sizes.default} ${className}`} {...props} />;
}
