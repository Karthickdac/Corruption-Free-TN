import { useI18n } from "@/contexts/i18n";

export default function Submit() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("submit_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t("submit_desc")}
        </p>
      </div>
      <div>Form in development...</div>
    </div>
  );
}
