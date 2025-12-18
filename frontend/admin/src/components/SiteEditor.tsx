import { useState } from 'react';
import { Eye, ArrowLeft, Settings, Package, Palette } from 'lucide-react';
import { SiteConfig } from '../App';
import { EditorSidebar } from './EditorSidebar';
import { TemplatePreview } from './TemplatePreview';

interface SiteEditorProps {
  config: SiteConfig;
  onUpdateConfig: (updates: Partial<SiteConfig>) => void;
  onPreview: () => void;
  onBackToTemplates: () => void;
}

type EditorTab = 'design' | 'products' | 'settings';

export function SiteEditor({ config, onUpdateConfig, onPreview, onBackToTemplates }: SiteEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('design');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <button
            onClick={onBackToTemplates}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к шаблонам
          </button>
          <h2>Редактор сайта</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'design'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            Дизайн
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            Товары
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
        </div>

        {/* Editor Content */}
        <EditorSidebar
          config={config}
          activeTab={activeTab}
          onUpdateConfig={onUpdateConfig}
        />

        {/* Preview Button */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={onPreview}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Предпросмотр сайта
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <TemplatePreview config={config} />
        </div>
      </div>
    </div>
  );
}
