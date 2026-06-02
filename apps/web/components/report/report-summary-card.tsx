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
      border: "border-[#7D9B7E]/40 bg-[#7D9B7E]/10",
      label: "text-[#7D9B7E]",
      value: "text-[#6B8B6C]",
      sub: "text-[#8FAB90]",
    },
    warning: {
      border: "border-red-400/40 bg-red-50",
      label: "text-red-500",
      value: "text-red-600",
      sub: "text-red-400",
    },
  };
  const c = highlight ? colors[variant] : null;

  return (
    <Card
      className={c ? c.border : "border-gray-200 bg-white"}
    >
      <CardHeader className="pb-1.5">
        <CardTitle
          className={`text-sm sm:text-base font-medium ${c ? c.label : "text-gray-500"}`}
        >
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl sm:text-3xl font-bold ${c ? c.value : "text-gray-900"}`}
        >
          {value}
        </div>
        {sub && (
          <p
            className={`text-sm mt-0.5 ${c ? c.sub : "text-gray-400"}`}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
