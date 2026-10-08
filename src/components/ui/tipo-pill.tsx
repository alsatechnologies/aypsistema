import * as React from "react"
import { ArrowDownToLine, Ship, Truck } from "lucide-react"

import { cn } from "@/lib/utils"

type TipoKey = "reciba" | "nacional" | "exportacion"

const tipoConfig: Record<TipoKey, { label: string; icon: React.ElementType; classes: string }> = {
  reciba: {
    label: "Reciba",
    icon: ArrowDownToLine,
    classes: "bg-[#E9F7EE] text-[#1C6B3B] border-[#CFEBD9] dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  },
  nacional: {
    label: "Nacional",
    icon: Truck,
    classes: "bg-[#EAF1FE] text-[#1E4FA8] border-[#D3E2FC] dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  },
  exportacion: {
    label: "Exportación",
    icon: Ship,
    classes: "bg-[#F3ECFE] text-[#6A2FC2] border-[#E4D6FC] dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25",
  },
}

// Acepta 'Reciba', 'Nacional', 'Embarque Nacional', 'Exportación', 'Embarque Exportación'
function resolveTipo(tipo: string): TipoKey | null {
  const t = tipo?.toLowerCase?.() ?? ""
  if (t.includes("reciba")) return "reciba"
  if (t.includes("nacional")) return "nacional"
  if (t.includes("export")) return "exportacion"
  return null
}

interface TipoPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tipo: string
}

function TipoPill({ tipo, className, ...props }: TipoPillProps) {
  const key = resolveTipo(tipo)
  const config = key ? tipoConfig[key] : null
  const Icon = config?.icon
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border py-0.5 pl-2 pr-2.5 text-[12.5px] font-medium",
        config?.classes ?? "bg-muted text-muted-foreground border-border",
        className
      )}
      title={tipo}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {config?.label ?? tipo}
    </span>
  )
}

export { TipoPill }
