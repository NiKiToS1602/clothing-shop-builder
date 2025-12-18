import { useState } from "react";
import { TemplateSelector } from "../components/TemplateSelector";
import { SiteEditor } from "../components/SiteEditor";
import { PreviewSite } from "../components/PreviewSite";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface SiteConfig {
  siteName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  template: string;
  products: Product[];
  heroTitle: string;
  heroSubtitle: string;
}

export function BuilderPage() {
  const [step, setStep] = useState<"template" | "editor" | "preview">("template");
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    siteName: "Мой магазин",
    logo: "",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    template: "",
    products: [],
    heroTitle: "Новая коллекция",
    heroSubtitle: "Откройте для себя уникальный стиль",
  });

  const handleTemplateSelect = (template: string) => {
    setSiteConfig((prev) => ({ ...prev, template }));
    setStep("editor");
  };

  const handleConfigUpdate = (updates: Partial<SiteConfig>) => {
    setSiteConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === "template" && <TemplateSelector onSelectTemplate={handleTemplateSelect} />}

      {step === "editor" && (
        <SiteEditor
          config={siteConfig}
          onUpdateConfig={handleConfigUpdate}
          onPreview={() => setStep("preview")}
          onBackToTemplates={() => setStep("template")}
        />
      )}

      {step === "preview" && <PreviewSite config={siteConfig} onBackToEditor={() => setStep("editor")} />}
    </div>
  );
}
