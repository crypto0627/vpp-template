"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSiteDataStore } from "@/stores/data-store";
import { SiteId } from "@/types/data-type";
import {
  generatePopupHTML,
  SITE_COORDS,
  SITE_NAMES,
  SITE_LOCATIONS,
} from "./map-components";

interface MapSectionProps {
  selectedSite: SiteId | null;
}

export function MapSection({ selectedSite }: MapSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const currentSiteRef = useRef<SiteId | null>(null);
  const mapLoadedRef = useRef(false);

  // Zustand store
  const { currentSite, setCurrentSite } = useSiteDataStore();

  // Update current site when selectedSite changes
  useEffect(() => {
    if (selectedSite && selectedSite !== currentSite) {
      setCurrentSite(selectedSite);
    }
  }, [selectedSite, currentSite, setCurrentSite]);

  // Initialize MapLibre with OpenFreeMap and 3D buildings
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [121.5654, 25.033],
      zoom: 12,
      minZoom: 6, // Prevent zooming out too far
      maxZoom: 20, // Maximum zoom for detailed view
      pitch: 45, // Tilt the map for 3D effect
      bearing: 0,
      maxBounds: [
        [60, -10], // Southwest coordinates [lng, lat]
        [180, 60], // Northeast coordinates [lng, lat]
      ], // Constrain map to prevent white space
      renderWorldCopies: false, // Prevent duplicate world rendering
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    // Add 3D buildings layer when map style loads
    map.on("load", () => {
      mapLoadedRef.current = true;

      // Add 3D buildings layer
      const layers = map.getStyle().layers;
      // Find the first symbol layer to insert buildings below labels
      let firstSymbolId: string | undefined;
      for (const layer of layers || []) {
        if (layer.type === "symbol") {
          firstSymbolId = layer.id;
          break;
        }
      }

      map.addLayer(
        {
          id: "3d-buildings",
          source: "openmaptiles",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#C4B8AC",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              0,
              14.05,
              ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              0,
              14.05,
              ["get", "render_min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        firstSymbolId,
      );

      // Create default neihu marker on map load
      const defaultSite: SiteId = "neihu";
      const coord = SITE_COORDS[defaultSite];

      const popup = new maplibregl.Popup({
        anchor: "bottom",
        offset: window.innerWidth < 640 ? 15 : 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: window.innerWidth < 640 ? "220px" : "280px",
        className: "custom-popup",
      }).setHTML(
        generatePopupHTML({
          siteName: SITE_NAMES[defaultSite],
          siteLocation: SITE_LOCATIONS[defaultSite],
          currentSite: defaultSite,
        }),
      );

      const marker = new maplibregl.Marker({ color: "#DA7756", scale: 1.2 })
        .setLngLat(coord)
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      currentSiteRef.current = defaultSite;

      map.flyTo({ center: coord, zoom: 14, duration: 1000 });
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Update map markers when site changes
  useEffect(() => {
    if (!mapRef.current || !mapLoadedRef.current) return;
    if (currentSiteRef.current === currentSite) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new site marker with popup
    const siteCoord = SITE_COORDS[currentSite];
    if (siteCoord && mapRef.current) {
      const popup = new maplibregl.Popup({
        anchor: "bottom",
        offset: window.innerWidth < 640 ? 15 : 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: window.innerWidth < 640 ? "220px" : "280px",
        className: "custom-popup",
      }).setHTML(
        generatePopupHTML({
          siteName: SITE_NAMES[currentSite],
          siteLocation: SITE_LOCATIONS[currentSite],
          currentSite,
        }),
      );

      const siteMarker = new maplibregl.Marker({
        color: "#DA7756",
        scale: 1.2,
      })
        .setLngLat(siteCoord)
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(siteMarker);

      mapRef.current.flyTo({
        center: siteCoord,
        zoom: 14,
        duration: 1000,
      });
    }

    currentSiteRef.current = currentSite;
  }, [currentSite]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
