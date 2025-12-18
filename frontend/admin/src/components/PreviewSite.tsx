import { ArrowLeft, ExternalLink, Download } from 'lucide-react';
import { SiteConfig } from '../App';
import { TemplatePreview } from './TemplatePreview';

interface PreviewSiteProps {
  config: SiteConfig;
  onBackToEditor: () => void;
}

export function PreviewSite({ config, onBackToEditor }: PreviewSiteProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToEditor}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться к редактору
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Предпросмотр: <span>{config.siteName}</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Открыть в новой вкладке
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Download className="w-4 h-4" />
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="container mx-auto p-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <TemplatePreview config={config} />
        </div>
      </div>

      {/* Info Panel */}
      <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-xl p-6 max-w-sm">
        <h3 className="mb-4">Информация о сайте</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Шаблон:</span>
            <span className="capitalize">{config.template}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Товаров:</span>
            <span>{config.products.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Основной цвет:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: config.primaryColor }}
              />
              <span>{config.primaryColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
