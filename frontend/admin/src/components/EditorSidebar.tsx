import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SiteConfig, Product } from '../App';

interface EditorSidebarProps {
  config: SiteConfig;
  activeTab: 'design' | 'products' | 'settings';
  onUpdateConfig: (updates: Partial<SiteConfig>) => void;
}

export function EditorSidebar({ config, activeTab, onUpdateConfig }: EditorSidebarProps) {
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    image: '',
    category: ''
  });

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.image) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        price: newProduct.price,
        image: newProduct.image,
        category: newProduct.category || 'Общее'
      };
      onUpdateConfig({ products: [...config.products, product] });
      setNewProduct({ name: '', price: 0, image: '', category: '' });
    }
  };

  const handleDeleteProduct = (id: string) => {
    onUpdateConfig({ products: config.products.filter(p => p.id !== id) });
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      {activeTab === 'design' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Название сайта</label>
            <input
              type="text"
              value={config.siteName}
              onChange={(e) => onUpdateConfig({ siteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Введите название"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Заголовок героя</label>
            <input
              type="text"
              value={config.heroTitle}
              onChange={(e) => onUpdateConfig({ heroTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Основной заголовок"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Подзаголовок</label>
            <input
              type="text"
              value={config.heroSubtitle}
              onChange={(e) => onUpdateConfig({ heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Описание"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Основной цвет</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => onUpdateConfig({ primaryColor: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => onUpdateConfig({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Вторичный цвет</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => onUpdateConfig({ secondaryColor: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.secondaryColor}
                onChange={(e) => onUpdateConfig({ secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-4">Добавить товар</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newProduct.name || ''}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Название товара"
              />
              <input
                type="number"
                value={newProduct.price || ''}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Цена"
              />
              <input
                type="text"
                value={newProduct.image || ''}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="URL изображения"
              />
              <input
                type="text"
                value={newProduct.category || ''}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Категория"
              />
              <button
                onClick={handleAddProduct}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить товар
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-4">Список товаров ({config.products.length})</h3>
            <div className="space-y-2">
              {config.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.price} ₽</div>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {config.products.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Товары не добавлены
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Шаблон</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg capitalize">
              {config.template}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">URL логотипа</label>
            <input
              type="text"
              value={config.logo}
              onChange={(e) => onUpdateConfig({ logo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 Дополнительные настройки будут доступны после публикации сайта
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
