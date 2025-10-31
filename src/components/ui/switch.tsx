
export function Switch({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v:boolean)=>void }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={!!checked} onChange={e=>onCheckedChange?.(e.target.checked)} />
      <span className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-indigo-600 relative">
        <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
      </span>
    </label>
  );
}
