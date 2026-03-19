import { ChevronDown, Share, ArrowDownToLine, ArrowUpToLine, MoreHorizontal, LucideIcon, Hash, Settings } from "lucide-react";

export interface DashboardAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: DashboardAction[];
}

export function DashboardHeader({ title, description, icon: Icon, actions = [] }: DashboardHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between py-5 px-4">
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 text-slate-500" />
        ) : (
          <Hash className="h-4 w-4 text-slate-400" />
        )}
        <h1 className="text-[18px] font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-0.5">
          <button className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            <ArrowUpToLine className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Import
          </button>
          <button className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            More actions
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-bold transition-all shadow-sm ${
              action.variant === "secondary"
                ? "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                : "bg-slate-900 text-white hover:bg-slate-800 ring-1 ring-slate-950"
            }`}
          >
            {action.icon && <action.icon className="h-3.5 w-3.5" />}
            {action.label}
          </button>
        ))}
        
        {/* Default 'Add' action placeholder if no primary is passed */}
        {actions.filter(a => a.variant !== 'secondary').length === 0 && (
          <button className="flex items-center gap-1.5 rounded-md bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm ring-1 ring-slate-950 hover:bg-black">
            Add item
          </button>
        )}
      </div>
    </div>
  );
}
