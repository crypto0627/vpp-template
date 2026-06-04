"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SiteId } from "./types";

const SITES: {
  id: SiteId;
  name: string;
  location: string;
  coords: [number, number];
  contractLimit: number;
  capacity: number;
  type: "charging" | "storage";
}[] = [
  {
    id: "neihu",
    name: "內湖Evalue旗艦站",
    location: "台北市內湖區",
    coords: [121.5932, 25.0687],
    contractLimit: 432,
    capacity: 370,
    type: "charging",
  },
  {
    id: "etai",
    name: "億泰電纜儲能站",
    location: "桃園市中壢區",
    coords: [121.19716647463314, 24.981115815374],
    contractLimit: 2400,
    capacity: 10030,
    type: "storage",
  },
];

interface HomeMapProps {
  onSiteSelect: (siteId: SiteId) => void;
}

export default function wHomeMap({ onSiteSelect }: HomeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSiteSelectRef = useRef(onSiteSelect);
  // eslint-disable-next-line react-hooks/refs
  onSiteSelectRef.current = onSiteSelect;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [121.45, 25.02],
      zoom: 10,
      minZoom: 6,
      maxZoom: 20,
      pitch: 45,
      renderWorldCopies: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      map.setPaintProperty("background", "background-color", "#2A1A0F");

      const layers = map.getStyle().layers;
      let firstSymbolId: string | undefined;
      for (const layer of layers ?? []) {
        if (layer.type === "symbol") {
          firstSymbolId = layer.id;
          break;
        }
      }

      SITES.forEach((site) => {
        const popup = new maplibregl.Popup({
          anchor: "bottom",
          offset: 25,
          closeButton: false,
          closeOnClick: true,
          maxWidth: "260px",
          className: "dark-popup",
        }).setHTML(`
          <style>
            .dark-popup .maplibregl-popup-content {
              background: #241508 !important;
              padding: 0 !important;
              border-radius: 12px !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
              border: 1px solid #3A2415 !important;
              overflow: hidden !important;
            }
            .dark-popup .maplibregl-popup-tip {
              border-top-color: #241508 !important;
            }
          </style>
          <div style="font-family:sans-serif;color:#fff;min-width:220px;">
            <div style="padding:12px 14px 10px;border-bottom:1px solid #3A2415;">
              <div style="font-weight:600;font-size:14px;margin-bottom:2px;">${site.name}</div>
              <div style="color:#E8883E;font-size:12px;">${site.location}</div>
            </div>
            <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div style="background:#2A1A0F;border-radius:8px;padding:8px;">
                <div style="color:#888;font-size:11px;margin-bottom:2px;">契約容量</div>
                <div style="font-weight:600;font-size:14px;">${site.contractLimit} <span style="color:#888;font-size:11px;font-weight:400;">kW</span></div>
              </div>
              <div style="background:#2A1A0F;border-radius:8px;padding:8px;">
                <div style="color:#888;font-size:11px;margin-bottom:2px;">儲能容量</div>
                <div style="font-weight:600;font-size:14px;">${site.capacity} <span style="color:#888;font-size:11px;font-weight:400;">kWh</span></div>
              </div>
              <div style="background:#2A1A0F;border-radius:8px;padding:8px;grid-column:span 2;">
                <div style="color:#888;font-size:11px;margin-bottom:2px;">站點種類</div>
                <div style="font-weight:600;font-size:13px;">${site.type === "storage" ? "儲能站" : "充電站"}</div>
              </div>
            </div>
            <div style="padding:0 14px 14px;">
              <a href="/sites/${site.id}" style="display:block;text-align:center;padding:8px;background:#E8883E;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
                進入儀表板
              </a>
            </div>
          </div>
        `);

        popup.on("open", () => {
          onSiteSelectRef.current(site.id);
          map.flyTo({ center: site.coords, zoom: 14, duration: 1000 });
        });

        new maplibregl.Marker({ color: "#E8883E", scale: 1.2 })
          .setLngLat(site.coords)
          .setPopup(popup)
          .addTo(map);
      });

      map.addLayer(
        {
          id: "3d-buildings",
          source: "carto",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#2a2a3a",
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "render_height"]],
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["get", "render_min_height"]],
            "fill-extrusion-opacity": 0.8,
          },
        },
        firstSymbolId,
      );
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />;
}
