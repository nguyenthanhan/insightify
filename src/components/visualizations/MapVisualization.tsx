import React, { useState } from "react";

interface RegionData {
  id: string;
  name: string;
  value: number;
  color?: string;
}

interface MapVisualizationProps {
  data: RegionData[];
  title?: string;
  mapType?: "us" | "world" | "custom";
  colorScale?: string[];
  showLegend?: boolean;
  onRegionClick?: (region: RegionData) => void;
}

// Simplified US state paths for demonstration
const US_STATES: Record<string, { path: string; center: [number, number] }> = {
  CA: {
    path: "M50,120 L70,100 L80,150 L60,180 L40,160 Z",
    center: [60, 140],
  },
  TX: {
    path: "M180,180 L240,160 L260,200 L240,240 L180,230 L160,200 Z",
    center: [210, 200],
  },
  NY: {
    path: "M380,80 L410,70 L420,100 L400,110 L380,100 Z",
    center: [400, 90],
  },
  FL: {
    path: "M340,220 L380,210 L390,260 L360,280 L340,250 Z",
    center: [365, 245],
  },
  IL: {
    path: "M280,100 L300,90 L310,140 L290,150 L270,130 Z",
    center: [290, 120],
  },
  PA: {
    path: "M360,100 L390,95 L395,120 L365,125 L355,115 Z",
    center: [375, 110],
  },
  OH: {
    path: "M320,100 L350,95 L355,130 L325,135 L315,120 Z",
    center: [335, 115],
  },
  GA: {
    path: "M340,180 L370,175 L375,210 L345,215 L335,195 Z",
    center: [355, 195],
  },
  NC: {
    path: "M350,160 L410,150 L415,170 L355,180 Z",
    center: [380, 165],
  },
  MI: {
    path: "M290,60 L320,55 L325,90 L295,95 L285,75 Z",
    center: [305, 75],
  },
};

export function MapVisualization({
  data,
  title,
  mapType: _mapType = "us", // Reserved for future map types
  colorScale = ["#fee2e2", "#fecaca", "#f87171", "#ef4444", "#dc2626"],
  showLegend = true,
  onRegionClick,
}: MapVisualizationProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Create data map
  const dataMap = new Map(data.map((d) => [d.id, d]));
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value: number): string => {
    if (value === 0) return "#f3f4f6";
    const index = Math.min(
      Math.ceil((value / maxValue) * (colorScale.length - 1)),
      colorScale.length - 1
    );
    return colorScale[index];
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const hoveredData = hoveredRegion ? dataMap.get(hoveredRegion) : null;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h3>
      )}

      <div className="relative">
        <svg
          viewBox="0 0 500 300"
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
        >
          {/* Background */}
          <rect
            width="500"
            height="300"
            fill="#f9fafb"
            className="dark:fill-gray-800"
          />

          {/* Regions */}
          {Object.entries(US_STATES).map(([stateId, state]) => {
            const regionData = dataMap.get(stateId);
            const value = regionData?.value || 0;
            const color = regionData?.color || getColor(value);
            const isHovered = hoveredRegion === stateId;

            return (
              <g key={stateId}>
                <path
                  d={state.path}
                  fill={color}
                  stroke={isHovered ? "#1f2937" : "#9ca3af"}
                  strokeWidth={isHovered ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredRegion(stateId)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => regionData && onRegionClick?.(regionData)}
                />
                {/* State label */}
                <text
                  x={state.center[0]}
                  y={state.center[1]}
                  textAnchor="middle"
                  className="text-[8px] fill-gray-600 dark:fill-gray-300 pointer-events-none"
                >
                  {stateId}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="font-medium">{hoveredData.name}</div>
            <div className="text-gray-300">
              Value: {hoveredData.value.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-gray-500">Low</span>
          <div className="flex">
            {colorScale.map((color, i) => (
              <div
                key={i}
                className="w-6 h-4"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">High</span>
        </div>
      )}

      {/* Data table */}
      <div className="mt-4 max-h-40 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-1 text-left">Region</th>
              <th className="px-2 py-1 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((region) => (
                <tr
                  key={region.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-2 py-1">{region.name}</td>
                  <td className="px-2 py-1 text-right">
                    {region.value.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MapVisualization;
