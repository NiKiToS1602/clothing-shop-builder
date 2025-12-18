import { SiteConfig } from '../App';
import { ShoppingBag, Menu, Search, Heart, User } from 'lucide-react';

interface TemplatePreviewProps {
  config: SiteConfig;
}

export function TemplatePreview({ config }: TemplatePreviewProps) {
  const displayProducts = config.products.length > 0
    ? config.products
    : [
        {
          id: '1',
          name: 'Пример товара',
          price: 2999,
          image: 'https://images.unsplash.com/photo-1562182856-e39faab686d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJlc3MlMjB3b21hbnxlbnwxfHx8fDE3NjU5MzQ1NjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          category: 'Платья'
        }
      ];

  if (config.template === 'modern') {
    return (
      <div className="bg-white">
        {/* Header */}
        <header className="border-b" style={{ borderColor: config.primaryColor + '20' }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div style={{ color: config.primaryColor }}>
                  {config.logo ? (
                    <img src={config.logo} alt={config.siteName} className="h-8" />
                  ) : (
                    <ShoppingBag className="w-8 h-8" />
                  )}
                </div>
                <nav className="hidden md:flex gap-6">
                  <a href="#" className="text-gray-700 hover:text-gray-900">Новинки</a>
                  <a href="#" className="text-gray-700 hover:text-gray-900">Женщинам</a>
                  <a href="#" className="text-gray-700 hover:text-gray-900">Мужчинам</a>
                  <a href="#" className="text-gray-700 hover:text-gray-900">Аксессуары</a>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <Search className="w-5 h-5 text-gray-600 cursor-pointer" />
                <Heart className="w-5 h-5 text-gray-600 cursor-pointer" />
                <User className="w-5 h-5 text-gray-600 cursor-pointer" />
                <ShoppingBag className="w-5 h-5 text-gray-600 cursor-pointer" />
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="relative h-96" style={{ backgroundColor: config.primaryColor }}>
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="max-w-xl" style={{ color: config.secondaryColor }}>
              <h1 className="mb-4">{config.heroTitle}</h1>
              <p className="mb-8 text-lg opacity-90">{config.heroSubtitle}</p>
              <button
                className="px-8 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: config.secondaryColor,
                  color: config.primaryColor
                }}
              >
                Смотреть коллекцию
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="mb-8">Популярные товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm mb-1">{product.name}</h3>
                <p style={{ color: config.primaryColor }}>{product.price} ₽</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (config.template === 'luxury') {
    return (
      <div className="bg-stone-50">
        {/* Header */}
        <header className="bg-black text-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Menu className="w-6 h-6 cursor-pointer" />
              <div className="text-center">
                {config.logo ? (
                  <img src={config.logo} alt={config.siteName} className="h-8 mx-auto" />
                ) : (
                  <div className="tracking-widest">{config.siteName.toUpperCase()}</div>
                )}
              </div>
              <ShoppingBag className="w-6 h-6 cursor-pointer" />
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="relative bg-gradient-to-r from-amber-900 to-amber-700 text-white">
          <div className="container mx-auto px-4 py-32 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="mb-6 tracking-wide">{config.heroTitle}</h1>
              <p className="mb-10 text-lg opacity-90">{config.heroSubtitle}</p>
              <button className="bg-white text-black px-10 py-4 rounded hover:bg-gray-100 transition-colors tracking-wide">
                ИССЛЕДОВАТЬ
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-center mb-12">Избранная коллекция</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="group">
                <div className="aspect-[3/4] bg-white rounded overflow-hidden mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="text-center">
                  <h3 className="mb-2">{product.name}</h3>
                  <p className="text-amber-800">{product.price} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (config.template === 'casual') {
    return (
      <div style={{ backgroundColor: config.secondaryColor }}>
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" style={{ color: config.primaryColor }}>
                {config.logo ? (
                  <img src={config.logo} alt={config.siteName} className="h-10" />
                ) : (
                  <>
                    <ShoppingBag className="w-8 h-8" />
                    <span>{config.siteName}</span>
                  </>
                )}
              </div>
              <nav className="hidden md:flex gap-6">
                <a href="#" className="hover:opacity-70" style={{ color: config.primaryColor }}>
                  Магазин
                </a>
                <a href="#" className="hover:opacity-70" style={{ color: config.primaryColor }}>
                  Новинки
                </a>
                <a href="#" className="hover:opacity-70" style={{ color: config.primaryColor }}>
                  Акции
                </a>
              </nav>
              <div className="flex gap-4">
                <Search className="w-6 h-6 cursor-pointer" style={{ color: config.primaryColor }} />
                <ShoppingBag className="w-6 h-6 cursor-pointer" style={{ color: config.primaryColor }} />
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div
          className="relative py-24"
          style={{
            background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`
          }}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-white">{config.heroTitle}</h1>
            <p className="text-white text-lg mb-10 opacity-90">{config.heroSubtitle}</p>
            <button
              className="px-10 py-4 rounded-full transition-all hover:scale-105"
              style={{
                backgroundColor: config.secondaryColor,
                color: config.primaryColor
              }}
            >
              Начать покупки
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="mb-10 text-center" style={{ color: config.primaryColor }}>
            Трендовые вещи
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm">{product.name}</h3>
                  <p style={{ color: config.primaryColor }}>{product.price} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default fallback if no template is selected
  return (
    <div className="flex items-center justify-center h-96 bg-gray-50">
      <div className="text-center p-8">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-gray-600">Выберите шаблон</h3>
        <p className="text-gray-500">Начните настройку вашего магазина, выбрав один из доступных шаблонов</p>
      </div>
    </div>
  );
}