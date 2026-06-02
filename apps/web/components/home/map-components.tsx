import { SiteId } from "@/types/data-type";
import { getSiteConfig, getSohForYear } from "@/config/site-configs";

export function PopupStyles() {
  return `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .maplibregl-popup-content {
        padding: 0 !important;
        background: #FAF7F4 !important;
        border: 1px solid #E8DDD3 !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        overflow: hidden !important;
        animation: fadeIn 0.3s ease-out;
      }
      .maplibregl-popup-close-button {
        color: #8B8178 !important;
        font-size: 18px !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: transparent !important;
        border: none !important;
        border-radius: 6px !important;
        right: 8px !important;
        top: 8px !important;
        transition: all 0.2s !important;
        z-index: 10 !important;
      }
      .maplibregl-popup-close-button:hover {
        background: #F5F0EA !important;
        color: #1A1915 !important;
      }
      .maplibregl-popup-tip {
        border-top-color: #FAF7F4 !important;
        border-bottom-color: #FAF7F4 !important;
      }
      @media (max-width: 640px) {
        .maplibregl-popup-content {
          max-width: 220px !important;
          border-radius: 10px !important;
        }
        .maplibregl-popup-close-button {
          font-size: 16px !important;
          width: 24px !important;
          height: 24px !important;
          right: 8px !important;
          top: 8px !important;
        }
      }
    </style>
  `;
}

interface PopupHeaderProps {
  siteName: string;
  siteLocation: string;
}

export function PopupHeader({ siteName, siteLocation }: PopupHeaderProps) {
  return `
    <!-- Clean Header -->
    <div class="p-3 pb-2 border-b border-gray-100" style="background: linear-gradient(to bottom, #F5F0EA, #FAF7F4);">
      <div class="flex items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-sm text-gray-900 mb-0.5">${siteName}</h3>
          <div class="text-gray-500 text-xs">
            <span>${siteLocation}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

interface PopupMetricsProps {
  currentSite: SiteId;
}

export function PopupMetrics({ currentSite }: PopupMetricsProps) {
  const config = getSiteConfig(currentSite);
  const sohPercent = Math.round(getSohForYear(config, new Date().getFullYear()) * 10000) / 100;

  return `
    <!-- Metrics Grid -->
    <div class="p-3 sm:p-4 space-y-2">
      <div class="grid grid-cols-1 gap-2">
        <!-- SOH -->
        <div class="rounded-lg p-2.5 bg-gray-50 border border-gray-200">
          <div class="text-xs font-medium text-gray-500 mb-1">健康度 (SOH)</div>
          <div class="text-base font-semibold text-gray-900 tabular-nums">${sohPercent}<span class="text-xs text-gray-500 ml-1 font-normal">%</span></div>
        </div>
      </div>
    </div>
  `;
}

interface PopupActionButtonProps {
  currentSite: SiteId;
}

export function PopupActionButton({ currentSite }: PopupActionButtonProps) {
  return `
    <!-- Action Button -->
    <div class="p-3 pt-0 border-t border-gray-100">
      <a href="/sites/${currentSite}"
         class="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-white bg-[#DA7756] hover:bg-[#C2614A] rounded-lg transition-colors duration-200">
        <span>進入儀表板</span>
      </a>
    </div>
  `;
}

interface GeneratePopupHTMLProps {
  siteName: string;
  siteLocation: string;
  currentSite: SiteId;
}

export function generatePopupHTML({
  siteName,
  siteLocation,
  currentSite,
}: GeneratePopupHTMLProps): string {
  return `
    ${PopupStyles()}
    <div class="w-full relative overflow-hidden">
      ${PopupHeader({ siteName, siteLocation })}

      ${PopupMetrics({ currentSite })}

      ${PopupActionButton({ currentSite })}
    </div>
  `;
}

// Site coordinates mapping
export const SITE_COORDS: Record<SiteId, [number, number]> = {
  neihu: [121.5932, 25.0687],
  etai: [121.19716647463314, 24.981115815374],
};

// Site names mapping
export const SITE_NAMES: Record<SiteId, string> = {
  neihu: "內湖Evalue旗艦站",
  etai: "億泰電纜儲能站",
};

// Site locations mapping
export const SITE_LOCATIONS: Record<SiteId, string> = {
  neihu: "台北市內湖區",
  etai: "桃園市中壢區",
};
