import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "amber" | "blue" | "orange" | "violet" | "green" | "red" | "gray"

const toneClasses: Record<StatusTone, { pill: string; dot: string }> = {
  amber:  { pill: "bg-[#FBF1DC] text-[#6E4A00] dark:bg-amber-500/15 dark:text-amber-300",    dot: "bg-[#C98A0B]" },
  blue:   { pill: "bg-[#E4EDFA] text-[#1D4A85] dark:bg-blue-500/15 dark:text-blue-300",      dot: "bg-[#3B74C4]" },
  orange: { pill: "bg-[#FCE9DF] text-[#83370F] dark:bg-orange-500/15 dark:text-orange-300",  dot: "bg-[#D4692E]" },
  violet: { pill: "bg-[#EEE8FA] text-[#4E3391] dark:bg-violet-500/15 dark:text-violet-300",  dot: "bg-[#7C5CC9]" },
  green:  { pill: "bg-[#E3F1E8] text-[#1F5E3A] dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-[#2E8B57]" },
  red:    { pill: "bg-[#FBE5E5] text-[#8E1B1B] dark:bg-red-500/15 dark:text-red-300",        dot: "bg-[#B23A3A]" },
  gray:   { pill: "bg-muted text-muted-foreground",                                          dot: "bg-muted-foreground/60" },
}

// Tono por defecto según el nombre del estatus (insensible a mayúsculas)
const toneByEstatus: Record<string, StatusTone> = {
  "pendiente": "amber",
  "nuevo": "amber",
  "peso bruto": "blue",
  "en proceso": "blue",
  "en_proceso": "blue",
  "en tránsito": "blue",
  "en_transito": "blue",
  "orden": "blue",
  "en descarga": "orange",
  "en carga": "orange",
  "peso tara": "violet",
  "completado": "green",
  "completada": "green",
  "enviado": "green",
  "activo": "green",
  "cancelado": "red",
  "cancelada": "red",
  "en taller": "red",
  "en_reparacion": "red",
}

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  estatus: string
  label?: string
  tone?: StatusTone
}

function StatusPill({ estatus, label, tone, className, ...props }: StatusPillProps) {
  const t = tone ?? toneByEstatus[estatus?.toLowerCase?.() ?? ""] ?? "gray"
  const { pill, dot } = toneClasses[t]
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-2 pr-2.5 text-[12.5px] font-medium",
        pill,
        className
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label ?? estatus}
    </span>
  )
}

export { StatusPill }
