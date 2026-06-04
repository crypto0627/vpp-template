import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportSummaryCard({
  label,
  value,
  sub,
  highlight = false,
  variant = "success",
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  variant?: "success" | "warning";
}) {
  const colors = {
    success: {
      border: "border-[#E8883E]/40 bg-[#E8883E]/10",
      label: "text-[#E8883E]",
      value: "text-[#FFAA66]",
      sub: "text-[#BEA98F]",
    },
    warning: {
      border: "border-[#E05454]/40 bg-[#E05454]/10",
      label: "text-[#E05454]",
      value: "text-[#E87878]",
      sub: "text-[#E05454]/70",
    },
  };
  const c = highlight ? colors[variant] : null;

  return (
    <Card
      className={c ? c.border : "border-[#3A2415] bg-[#2A1A0F]"}
    >
      <CardHeader className="pb-1.5">
        <CardTitle
          className={`text-sm sm:text-base font-medium ${c ? c.label : "text-white/50"}`}
        >
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl sm:text-3xl font-bold ${c ? c.value : "text-white"}`}
        >
          {value}
        </div>
        {sub && (
          <p
            className={`text-sm mt-0.5 ${c ? c.sub : "text-white/40"}`}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
