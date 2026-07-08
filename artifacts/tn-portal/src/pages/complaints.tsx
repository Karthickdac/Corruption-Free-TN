import { useState } from "react";
import { useI18n } from "@/contexts/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListComplaints, useListDistricts, useListDepartments } from "@workspace/api-client-react";
import { Search, MapPin, Building, Calendar, Filter } from "lucide-react";
import { Link } from "wouter";

export default function Complaints() {
  const { t, isTa } = useI18n();
  const [districtId, setDistrictId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const { data: districts } = useListDistricts();
  const { data: departments } = useListDepartments();
  const { data: complaints, isLoading } = useListComplaints({
    districtId: districtId && districtId !== "all" ? parseInt(districtId) : undefined,
    departmentId: departmentId && departmentId !== "all" ? parseInt(departmentId) : undefined,
    status: status && status !== "all" ? status : undefined,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-stone-500/10 text-stone-600 border-stone-500/20';
      case 'under_review': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'under_investigation': return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
      case 'action_taken': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'resolved': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'rejected': return 'bg-red-600/10 text-red-600 border-red-600/20';
      default: return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("complaints_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t("complaints_desc")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-muted/20 p-4 rounded-lg border border-border/40">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold uppercase tracking-wider text-sm">Filters</span>
        </div>
        
        <Select value={districtId} onValueChange={setDistrictId}>
          <SelectTrigger className="w-full md:w-[200px] bg-background">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts?.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>{isTa && d.nameTa ? d.nameTa : d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full md:w-[250px] bg-background">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>{isTa && d.nameTa ? d.nameTa : d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[200px] bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="under_investigation">Investigating</SelectItem>
            <SelectItem value="action_taken">Action Taken</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        
        {(districtId || departmentId || status) && (
          <Button variant="ghost" onClick={() => { setDistrictId(""); setDepartmentId(""); setStatus(""); }} className="ml-auto">
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg border border-border/40"></div>
          ))}
        </div>
      ) : complaints?.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-lg border border-border/40 border-dashed">
          <p className="text-muted-foreground text-lg">No complaints found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints?.map((complaint) => (
            <Card key={complaint.id} className="overflow-hidden hover-elevate transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/40">
                      {complaint.complaintNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(complaint.status)}`}>
                      {t(`status_${complaint.status}` as any) || complaint.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center ml-auto">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{complaint.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
                    {complaint.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                    {complaint.districtName && (
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-primary/70" />
                        {complaint.districtName}
                      </span>
                    )}
                    {complaint.departmentName && (
                      <span className="flex items-center">
                        <Building className="h-3.5 w-3.5 mr-1 text-primary/70" />
                        {complaint.departmentName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
