import { useI18n } from "@/contexts/i18n";
import { useListDistricts, useListDepartments, useListMinistries } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Building, Phone, Mail, User } from "lucide-react";

export default function Directory() {
  const { t, isTa } = useI18n();
  const { data: districts, isLoading: isLoadingDistricts } = useListDistricts();
  const { data: departments, isLoading: isLoadingDepts } = useListDepartments();
  const { data: ministries } = useListMinistries();

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("dir_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t("dir_desc")}
        </p>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/30 border border-border/40">
          <TabsTrigger value="departments" className="font-semibold uppercase tracking-wider text-xs px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Departments
          </TabsTrigger>
          <TabsTrigger value="districts" className="font-semibold uppercase tracking-wider text-xs px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Districts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="departments" className="space-y-8 animate-in fade-in duration-500">
          {isLoadingDepts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg border border-border/40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments?.map((dept) => {
                const ministry = ministries?.find(m => m.id === dept.ministryId);
                return (
                  <Card key={dept.id} className="hover-elevate">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold leading-tight">
                          {isTa && dept.nameTa ? dept.nameTa : dept.name}
                        </CardTitle>
                        <Building className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                      </div>
                      {ministry && (
                        <p className="text-xs uppercase font-bold tracking-wider text-primary mt-1">
                          {isTa && ministry.nameTa ? ministry.nameTa : ministry.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="space-y-2 mt-2 pt-4 border-t border-border/40">
                        {dept.secretary && (
                          <div className="flex items-center text-muted-foreground">
                            <User className="h-4 w-4 mr-2 text-foreground/50" />
                            <span className="font-medium text-foreground mr-1">Secretary:</span> {dept.secretary}
                          </div>
                        )}
                        {dept.contactPhone && (
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2 text-foreground/50" />
                            {dept.contactPhone}
                          </div>
                        )}
                        {dept.contactEmail && (
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2 text-foreground/50" />
                            {dept.contactEmail}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="districts" className="animate-in fade-in duration-500">
          {isLoadingDistricts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg border border-border/40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {districts?.map((district) => (
                <div key={district.id} className="bg-card border border-border/60 rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <span className="font-medium">{isTa && district.nameTa ? district.nameTa : district.name}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{district.code}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
