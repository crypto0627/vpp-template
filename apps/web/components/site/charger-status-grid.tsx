"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteDataStore } from "@/stores/data-store";
import { useMemo } from "react";

interface ChargerStatus {
  id: string;
  status: "charging" | "available" | "offline";
  power: number;
}

export function ChargerStatusGrid() {
  const { data, currentSite } = useSiteDataStore();
  const siteData = data[currentSite];

  // Build chargers array from store data
  const chargers: ChargerStatus[] = useMemo(() => {
    if (!siteData || siteData.length === 0) {
      return [];
    }

    const latestData = siteData[siteData.length - 1];
    if (!latestData?.ChargingInfo) {
      return [];
    }

    const chargingInfo = latestData.ChargingInfo;
    const newChargers: ChargerStatus[] = [];

    // SuperCharging (快充)
    const superCharger = chargingInfo.SuperCharging;
    if (
      superCharger &&
      typeof superCharger === "object" &&
      "開關" in superCharger &&
      "數值" in superCharger
    ) {
      const isOn = superCharger.開關 === "開";
      const rawPower = superCharger.數值 || 0;
      const powerValue = Math.round(rawPower * 100) / 100;

      newChargers.push({
        id: "SuperCharging",
        status: isOn ? (powerValue > 0 ? "charging" : "available") : "offline",
        power: powerValue,
      });
    }

    // DC charger
    const dcCharger = chargingInfo.DC;
    if (
      dcCharger &&
      typeof dcCharger === "object" &&
      "開關" in dcCharger &&
      "數值" in dcCharger
    ) {
      const isOn = dcCharger.開關 === "開";
      const rawPower = dcCharger.數值 || 0;
      const powerValue = Math.round(rawPower * 100) / 100; // 保留小數點後兩位

      newChargers.push({
        id: "DC",
        status: isOn ? (powerValue > 0 ? "charging" : "available") : "offline",
        power: powerValue,
      });
    }

    // AC chargers (AC1 to AC15)
    for (let i = 1; i <= 15; i++) {
      const acKey = `AC${i}`;
      const acCharger = chargingInfo[acKey];

      if (
        acCharger &&
        typeof acCharger === "object" &&
        "開關" in acCharger &&
        "數值" in acCharger
      ) {
        const isOn = acCharger.開關 === "開";
        const rawPower = acCharger.數值 || 0;
        const powerValue = Math.round(rawPower * 100) / 100; // 保留小數點後兩位

        newChargers.push({
          id: acKey,
          status: isOn
            ? powerValue > 0
              ? "charging"
              : "available"
            : "offline",
          power: powerValue,
        });
      }
    }

    return newChargers;
  }, [siteData]);

  const getStatusConfig = (status: ChargerStatus["status"]) => {
    switch (status) {
      case "charging":
        return {
          color: "border-[#D4A56A] bg-white",
          textColor: "text-[#D4A56A]",
          bgColor: "bg-[#D4A56A]/10",
          label: "充電中",
        };
      case "available":
        return {
          color: "border-[#7D9B7E] bg-white",
          textColor: "text-[#7D9B7E]",
          bgColor: "bg-[#7D9B7E]/10",
          label: "可用",
        };
      case "offline":
        return {
          color: "border-gray-300 bg-white",
          textColor: "text-gray-500",
          bgColor: "bg-gray-50",
          label: "離線",
        };
    }
  };

  const statusCounts = {
    charging: chargers.filter((c) => c.status === "charging").length,
    available: chargers.filter((c) => c.status === "available").length,
    offline: chargers.filter((c) => c.status === "offline").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="border-gray-200 bg-white backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
            充電樁狀態總覽
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white border-2 border-[#D4A56A]">
              <div>
                <div className="text-sm sm:text-base text-gray-600">充電中</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D4A56A]">
                  {statusCounts.charging}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white border-2 border-[#7D9B7E]">
              <div>
                <div className="text-sm sm:text-base text-gray-600">可用</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7D9B7E]">
                  {statusCounts.available}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white border-2 border-gray-300">
              <div>
                <div className="text-sm sm:text-base text-gray-600">離線</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-500">
                  {statusCounts.offline}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charger Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {chargers.map((charger) => {
          const config = getStatusConfig(charger.status);

          return (
            <Card
              key={charger.id}
              className={`${config.color} border-2 backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            >
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-bold text-gray-900">
                    {charger.id}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-sm sm:text-base font-medium ${config.bgColor} ${config.textColor}`}
                >
                  {config.label}
                </div>

                {charger.status === "charging" && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="text-gray-600">功率</span>
                      <span
                        className={`font-bold ${config.textColor} text-sm sm:text-base`}
                      >
                        {charger.power > 1000
                          ? `${(charger.power / 1000).toFixed(1)} kW`
                          : `${charger.power} W`}
                      </span>
                    </div>
                  </div>
                )}

                {charger.status === "available" && (
                  <div className="text-sm sm:text-base text-gray-600 pt-2">
                    準備就緒
                  </div>
                )}

                {charger.status === "offline" && (
                  <div className="text-sm sm:text-base text-gray-600 pt-2">
                    設備維護中
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
