import { Store, Sparkles, Shirt } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (template: string) => void;
}

const templates = [
  {
    id: 'modern',
    name: 'Современный',
    description: 'Минималистичный дизайн с акцентом на товары',
    icon: Store,
    preview: 'bg-gradient-to-br from-slate-900 to-slate-700'
  },
  {
    id: 'luxury',
    name: 'Люкс',
    description: 'Элегантный дизайн для премиум брендов',
    icon: Sparkles,
    preview: 'bg-gradient-to-br from-amber-900 to-amber-700'
  },
  {
    id: 'casual',
    name: 'Повседневный',
    description: 'Яркий и дружелюбный стиль',
    icon: Shirt,
    preview: 'bg-gradient-to-br from-blue-500 to-purple-600'
  }
];

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="mb-4">
            Создайте свой интернет-магазин одежды
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Выберите шаблон, который лучше всего подходит вашему бренду. 
            Вы сможете настроить каждую деталь позже.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden text-left transform hover:-translate-y-2"
              >
                <div className={`h-48 ${template.preview} flex items-center justify-center`}>
                  <Icon className="w-20 h-20 text-white opacity-80" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-gray-600">
                    {template.description}
                  </p>
                  <div className="mt-4 text-indigo-600 flex items-center gap-2">
                    Выбрать шаблон
                    <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
