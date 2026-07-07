import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useListTaluksByDistrict, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, ChevronRight, Building2 } from "lucide-react";
import { Link } from "wouter";

type DistrictPoint = {
  districtId: number;
  districtName: string;
  districtCode?: string;
  total: number;
  resolved?: number;
  pending?: number;
  density?: number;
};

type Props = {
  mapData: DistrictPoint[];
};

const GEO_URL = "/tn-districts.geojson";

function densityColor(density: number, maxDensity: number): string {
  if (density === 0) return "#1e3a5f";
  const pct = maxDensity > 0 ? density / maxDensity : 0;
  if (pct < 0.2) return "#fde68a";
  if (pct < 0.4) return "#fb923c";
  if (pct < 0.6) return "#f97316";
  if (pct < 0.8) return "#dc2626";
  return "#991b1b";
}

function DrilldownPanel({
  districtPoint,
  onClose,
}: {
  districtPoint: DistrictPoint;
  onClose: () => void;
}) {
  const { data: taluks, isLoading: taluksLoading } = useListTaluksByDistrict(
    districtPoint.districtId
  );
  const { data: departments } = useListDepartments();

  const resolved = districtPoint.resolved ?? 0;
  const total = districtPoint.total;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const did = districtPoint.districtId;

  return (
    <div className="mt-4 border border-border rounded-lg bg-muted/20 p-4 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-primary" />
        <h4 className="font-bold text-base">{districtPoint.districtName} District</h4>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background rounded p-3 text-center border border-border/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-mono font-bold">{total}</p>
        </div>
        <div className="bg-background rounded p-3 text-center border border-border/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resolved</p>
          <p className="text-2xl font-mono font-bold text-emerald-500">{resolved}</p>
        </div>
        <div className="bg-background rounded p-3 text-center border border-border/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rate</p>
          <p className={`text-2xl font-mono font-bold ${rate >= 60 ? "text-emerald-500" : rate >= 30 ? "text-amber-500" : "text-red-500"}`}>
            {rate}%
          </p>
        </div>
      </div>

      {taluksLoading ? (
        <p className="text-xs text-muted-foreground">Loading taluks…</p>
      ) : taluks && taluks.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Taluks</p>
          <div className="flex flex-wrap gap-2">
            {taluks.map((taluk) => (
              <Link
                key={taluk.id}
                href={`/search?districtId=${did}&talukId=${taluk.id}`}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs gap-1"
                >
                  {taluk.name}
                  <ChevronRight className="h-2.5 w-2.5" />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {departments && departments.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Building2 className="h-3 w-3" /> By Department
          </p>
          <div className="flex flex-wrap gap-2">
            {departments.slice(0, 8).map((dept) => (
              <Link
                key={dept.id}
                href={`/search?districtId=${did}&departmentId=${dept.id}`}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs gap-1"
                >
                  {dept.name.replace(/\s*Department\s*$/i, "").slice(0, 22)}
                  <ChevronRight className="h-2.5 w-2.5" />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border/40 flex gap-2 flex-wrap">
        <Link href={`/search?districtId=${did}`}>
          <Button variant="outline" size="sm" className="text-xs">
            All complaints →
          </Button>
        </Link>
        <Link href={`/search?districtId=${did}&q=village`}>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Search by village
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function TNDistrictMap({ mapData }: Props) {
  const [selected, setSelected] = useState<DistrictPoint | null>(null);

  const dataByName: Record<string, DistrictPoint> = {};
  for (const d of mapData) {
    dataByName[d.districtName.toLowerCase()] = d;
  }

  const maxDensity = Math.max(1, ...mapData.map((d) => d.density ?? d.total));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 7200, center: [78.4, 10.85] }}
          width={580}
          height={700}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, string>; [k: string]: unknown }> }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.district ?? "";
                const point = dataByName[name.toLowerCase()];
                const density = point?.density ?? point?.total ?? 0;
                const isSelected = selected?.districtName.toLowerCase() === name.toLowerCase();
                const fill = densityColor(density, maxDensity);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      const next = point ?? { districtId: 0, districtName: name, total: 0 };
                      setSelected(isSelected ? null : next);
                    }}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected ? "#fbbf24" : "#94a3b8",
                        strokeWidth: isSelected ? 2 : 0.6,
                        fillOpacity: 0.9,
                        outline: "none",
                      },
                      hover: {
                        fill,
                        stroke: "#fbbf24",
                        strokeWidth: 1.8,
                        fillOpacity: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill,
                        stroke: "#fbbf24",
                        strokeWidth: 2,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground justify-center">
          {[
            { label: "No complaints", color: "#1e3a5f" },
            { label: "Very low", color: "#fde68a" },
            { label: "Low", color: "#fb923c" },
            { label: "Medium", color: "#f97316" },
            { label: "High", color: "#dc2626" },
            { label: "Highest", color: "#991b1b" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="lg:w-80 space-y-3">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">
            Top Districts by Volume
          </p>
          <div className="space-y-1.5">
            {[...mapData]
              .sort((a, b) => b.total - a.total)
              .slice(0, 10)
              .map((d) => {
                const maxTotal = Math.max(1, ...mapData.map((x) => x.total));
                const pct = Math.round((d.total / maxTotal) * 100);
                const resolved = d.resolved ?? 0;
                const rate = d.total > 0 ? Math.round((resolved / d.total) * 100) : 0;
                const isActive = selected?.districtName === d.districtName;
                return (
                  <button
                    key={d.districtId}
                    onClick={() => setSelected(isActive ? null : d)}
                    className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                      isActive
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{d.districtName}</span>
                      <span className={`font-mono font-bold text-[11px] ${rate >= 60 ? "text-emerald-500" : rate >= 30 ? "text-amber-500" : "text-red-500"}`}>
                        {rate}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: densityColor(d.density ?? d.total, maxDensity) }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5 text-muted-foreground">
                      <span>{d.total} complaints</span>
                      <span>{resolved} resolved</span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {selected && (
          <DrilldownPanel districtPoint={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
