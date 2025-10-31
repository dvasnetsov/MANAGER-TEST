
import React, { ReactNode } from "react";
type SelectProps = { value?: string; onValueChange?: (v: string)=>void; children?: ReactNode };
export function Select({ value, onValueChange, children }: SelectProps) {
  function flatten(node: ReactNode, acc: any[] = []) {
    React.Children.forEach(node as any, (child: any) => {
      if (!child) return;
      if (child.type && child.type.displayName === "SelectItem") {
        acc.push({ value: child.props.value, label: child.props.children });
      } else if (child.props && child.props.children) {
        flatten(child.props.children, acc);
      }
    });
    return acc;
  }
  const options = flatten(children);
  return (
    <select className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
      value={value ?? ""}
      onChange={(e)=>onValueChange?.(e.target.value)}>
      <option value="" disabled hidden>Выбрать...</option>
      {options.map((o, i)=> <option key={i} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function SelectTrigger({ children }: { children?: ReactNode }) { return <>{children}</>; }
export function SelectValue({ placeholder }: { placeholder?: string }) { return <span>{placeholder}</span>; }
export function SelectContent({ children }: { children?: ReactNode }) { return <>{children}</>; }
export function SelectItem({ children }: { value: string; children: ReactNode }) { return <>{children}</>; }
SelectItem.displayName = "SelectItem";
