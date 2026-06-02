"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Site, SiteId } from "@/types/data-type";

const mockSites: Site[] = [
  {
    id: "neihu",
    name: "內湖Evalue旗艦站",
    location: "台北市內湖區",
    status: "online",
    contract_limit: 432,
    capacity: 370,
    type: "charging",
  },
{
    id: "etai",
    name: "億泰電纜儲能站",
    location: "桃園市中壢區",
    status: "online",
    contract_limit: 2400,
    capacity: 10030,
    type: "storage",
  },
];

interface SiteSidebarProps {
  selectedSite: SiteId | null;
  onSiteSelect: (siteId: SiteId) => void;
}

export function SiteSidebar({ selectedSite, onSiteSelect }: SiteSidebarProps) {
  const getStatusText = (status: Site["status"]) => {
    switch (status) {
      case "online":
        return "運行中";
      case "offline":
        return "離線";
      case "maintenance":
        return "維護中";
      default:
        return "未知";
    }
  };

  return (
    <div className="w-full md:w-90 h-full p-0 md:p-4 flex flex-col">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border-0 md:border md:border-gray-200 p-4 md:p-5 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            案場切換
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            選擇要查看的案場資訊
          </p>
        </div>

        {/* Site Cards - Scrollable */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          {mockSites.map((site) => {
            const isSelected = selectedSite === site.id;

            return (
              <Card
                key={site.id}
                className={`cursor-pointer transition-colors duration-200 border ${
                  isSelected
                    ? "bg-[#DA7756] text-white border-[#DA7756]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onSiteSelect(site.id)}
              >
                <CardContent className="p-3">
                  {/* Site Header */}
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className={`font-semibold text-base sm:text-lg ${isSelected ? "text-white" : "text-gray-900"}`}
                    >
                      {site.name}
                    </h3>
                    <span
                      className={`text-sm ${isSelected ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {getStatusText(site.status)}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="mb-3">
                    <span
                      className={`text-sm ${isSelected ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {site.location}
                    </span>
                  </div>

                  {/* Power Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`p-2 rounded ${isSelected ? "bg-white/10" : "bg-gray-50"}`}
                    >
                      <div
                        className={`text-sm mb-1 ${isSelected ? "text-gray-300" : "text-gray-600"}`}
                      >
                        契約容量
                      </div>
                      <p
                        className={`text-base sm:text-lg font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}
                      >
                        {site.contract_limit}
                      </p>
                      kW
                    </div>

                    <div
                      className={`p-2 rounded ${isSelected ? "bg-white/10" : "bg-gray-50"}`}
                    >
                      <div
                        className={`text-sm mb-1 ${isSelected ? "text-gray-300" : "text-gray-600"}`}
                      >
                        容量
                      </div>
                      <p
                        className={`text-base sm:text-lg font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}
                      >
                        {site.capacity}
                      </p>
                      kWh
                    </div>
                  </div>

                  {/* Type */}
                  <div className="mt-2">
                    <span
                      className={`text-sm ${isSelected ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {site.type === "storage" ? "儲能站" : "充電站"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
