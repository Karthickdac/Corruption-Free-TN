import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useListTaluksByDistrict, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, ChevronRight, Building2, Home } from "lucide-react";
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

type TalukItem = { id: number; name: string };
type VillageItem = { village: string; total: number; resolved: number };

type Props = {
  mapData: DistrictPoint[];
};

const GEO_URL = "/tn-districts.geojson";

// Orange/Red scale instead of green
function densityColor(density: number, maxDensity: number): string {
  if (density === 0) return "hsl(var(--muted))";
  const pct = maxDensity > 0 ? density / maxDensity : 0;
  if (pct < 0.2) return "hsl(var(--primary) / 0.2)";
  if (pct < 0.4) return "hsl(var(--primary) / 0.4)";
  if (pct < 0.6) return "hsl(var(--primary) / 0.6)";
  if (pct < 0.8) return "hsl(var(--primary) / 0.8)";
  return "hsl(var(--primary))";
}

function useVillages(districtId: number, talukId: number | null) {
  return useQuery<VillageItem[]>({
    queryKey: ["analytics-villages", districtId, talukId],
    enabled: districtId > 0 && talukId !== null,
    queryFn: async () => {
      const params = new URLSearchParams({ districtId: String(districtId) });
      if (talukId) params.set("talukId", String(talukId));
      const resp = await fetch(`/api/analytics/villages?${params}`);
      if (!resp.ok) throw new Error("Failed to load village data");
      return resp.json();
    },
    staleTime: 60_000,
  });
}

function DrilldownPanel({
  districtPoint,
  onClose,
}: {
  districtPoint: DistrictPoint;
  onClose: () => void;
}) {
  const [selectedTaluk, setSelectedTaluk] = useState<TalukItem | null>(null);

  const { data: taluks, isLoading: taluksLoading } = useListTaluksByDistrict(
    districtPoint.districtId
  );
  const { data: departments } = useListDepartments();
  const { data: villages, isLoading: villagesLoading } = useVillages(
    districtPoint.districtId,
    selectedTaluk ? selectedTaluk.id : null
  );

  const resolved = districtPoint.resolved ?? 0;
  const total = districtPoint.total;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const did = districtPoint.districtId;

  return (
    <div className="mt-4 border border-border/50 rounded-2xl bg-card shadow-sm p-5 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-base text-foreground">{districtPoint.districtName} District</h4>
        {selectedTaluk && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-primary">{selectedTaluk.name}</span>
            <button onClick={() => setSelectedTaluk(null)} className="ml-1 p-0.5 rounded-full hover:bg-muted transition-colors">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-bold text-foreground">{total}</p>
        </div>
        <div className="bg-emerald-50/50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Resolved</p>
          <p className="text-xl font-bold text-emerald-600">{resolved}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/40">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Rate</p>
          <p className={`text-xl font-bold ${rate >= 60 ? "text-emerald-600" : rate >= 30 ? "text-amber-600" : "text-red-600"}`}>
            {rate}%
          </p>
        </div>
      </div>

      {!selectedTaluk ? (
        <>
          {taluksLoading ? (
            <p className="text-xs text-muted-foreground mb-4">Loading taluks…</p>
          ) : taluks && taluks.length > 0 ? (
            <div className="mb-5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2">
                Taluks — select to drill down
              </p>
              <div className="flex flex-wrap gap-2">
                {taluks.map((taluk) => (
                  <button
                    key={taluk.id}
                    onClick={() => setSelectedTaluk(taluk)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    {taluk.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {departments && departments.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
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
                      className="cursor-pointer hover:bg-primary/10 transition-colors text-[11px] px-2 py-0.5 font-medium border-transparent shadow-none"
                    >
                      {dept.name.replace(/\s*Department\s*$/i, "").slice(0, 22)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mb-2">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Home className="h-3 w-3" /> Villages in {selectedTaluk.name}
          </p>
          {villagesLoading ? (
            <p className="text-xs text-muted-foreground">Loading villages…</p>
          ) : villages && villages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {villages.map((v) => (
                <Link
                  key={v.village}
                  href={`/search?districtId=${did}&talukId=${selectedTaluk.id}&q=${encodeURIComponent(v.village)}`}
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors text-[11px] px-2 py-0.5 font-medium border-border/60"
                  >
                    {v.village}
                    <span className="text-muted-foreground ml-1.5">({v.total})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No village data for this taluk yet</p>
          )}

          {departments && departments.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> By Department
              </p>
              <div className="flex flex-wrap gap-2">
                {departments.slice(0, 6).map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/search?districtId=${did}&talukId=${selectedTaluk.id}&departmentId=${dept.id}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 transition-colors text-[11px] px-2 py-0.5 font-medium border-transparent shadow-none"
                    >
                      {dept.name.replace(/\s*Department\s*$/i, "").slice(0, 20)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-border/40 flex gap-2">
        <Link href={selectedTaluk ? `/search?districtId=${did}&talukId=${selectedTaluk.id}` : `/search?districtId=${did}`}>
          <Button variant="outline" size="sm" className="w-full text-xs font-medium rounded-xl h-9">
            {selectedTaluk ? `View all complaints in ${selectedTaluk.name}` : `View all complaints in district`}
          </Button>
        </Link>
      </div>
    </div>
  );
}

type TooltipState = {
  name: string;
  total: number;
  resolved: number;
  rate: number;
  x: number;
  y: number;
};

export default function TNDistrictMap({ mapData }: Props) {
  const [selected, setSelected] = useState<DistrictPoint | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const dataByName: Record<string, DistrictPoint> = {};
  for (const d of mapData) {
    dataByName[d.districtName.toLowerCase()] = d;
  }

  const maxDensity = Math.max(1, ...mapData.map((d) => d.density ?? d.total));

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div
        className="flex-1 min-w-0 relative"
        onMouseMove={(e) => {
          if (tooltip) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({ ...tooltip, x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
      >
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 text-sm shadow-xl"
            style={{ left: tooltip.x + 16, top: tooltip.y - 12 }}
          >
            <p className="font-semibold text-foreground mb-2 pb-1 border-b border-border/40">{tooltip.name}</p>
            <div className="space-y-1">
              <p className="text-muted-foreground flex justify-between gap-4"><span>Total:</span> <span className="font-semibold text-foreground">{tooltip.total}</span></p>
              <p className="text-muted-foreground flex justify-between gap-4"><span>Resolved:</span> <span className="font-semibold text-emerald-600">{tooltip.resolved}</span></p>
              <p className="text-muted-foreground flex justify-between gap-4"><span>Rate:</span> <span className={`font-semibold ${tooltip.rate >= 60 ? "text-emerald-600" : tooltip.rate >= 30 ? "text-amber-600" : "text-red-600"}`}>{tooltip.rate}%</span></p>
            </div>
          </div>
        )}
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
                    onMouseEnter={(_geo: unknown, e: React.MouseEvent) => {
                      const total = point?.total ?? 0;
                      const resolved = point?.resolved ?? 0;
                      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
                      const container = (e.currentTarget as SVGElement | null)?.closest(".relative");
                      const rect = container?.getBoundingClientRect();
                      setTooltip({
                        name,
                        total,
                        resolved,
                        rate,
                        x: rect ? e.clientX - rect.left : 0,
                        y: rect ? e.clientY - rect.top : 0,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected ? "hsl(var(--foreground))" : "hsl(var(--background))",
                        strokeWidth: isSelected ? 2 : 0.8,
                        fillOpacity: 0.9,
                        outline: "none",
                      },
                      hover: {
                        fill,
                        stroke: "hsl(var(--foreground))",
                        strokeWidth: 2,
                        fillOpacity: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill,
                        stroke: "hsl(var(--foreground))",
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

        <div className="flex flex-wrap items-center gap-4 mt-6 text-xs font-medium text-muted-foreground justify-center bg-muted/20 py-3 px-4 rounded-full border border-border/40 inline-flex mx-auto">
          {[
            { label: "None", color: densityColor(0, maxDensity) },
            { label: "Low", color: densityColor(maxDensity * 0.2, maxDensity) },
            { label: "Medium", color: densityColor(maxDensity * 0.5, maxDensity) },
            { label: "High", color: densityColor(maxDensity * 0.8, maxDensity) },
            { label: "Max", color: densityColor(maxDensity, maxDensity) },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm inline-block shadow-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="lg:w-80 space-y-4">
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="bg-muted/20 px-5 py-3 border-b border-border/40">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
               Top Districts by Volume
             </p>
          </div>
          <div className="p-2 space-y-1">
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
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/5 shadow-sm border border-primary/20"
                        : "hover:bg-muted/40 border border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm text-foreground">{d.districtName}</span>
                      <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${rate >= 60 ? "bg-emerald-100/50 text-emerald-700" : rate >= 30 ? "bg-amber-100/50 text-amber-700" : "bg-red-100/50 text-red-700"}`}>
                        {rate}% resolved
                      </span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: densityColor(d.density ?? d.total, maxDensity) }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>{d.total} total</span>
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
