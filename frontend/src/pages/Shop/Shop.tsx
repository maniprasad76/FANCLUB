import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedPage from '../../components/AnimatedPage';
import ProductCard from '../../components/ProductCard/ProductCard';
import SEOHead, { buildCollectionSchema, buildBreadcrumbSchema } from '../../components/SEOHead';
import Breadcrumbs from '../../components/Breadcrumbs';
import api from '../../lib/api';
import './Shop.css';
import { useDevice } from '../../context/DeviceContext';

export default function Shop() {
  const { isDesktop } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const gender = searchParams.get('gender') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const fetchWithRetry = async (url: string, config?: any, retries = 3, delay = 800): Promise<any> => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await api.get(url, config);
      } catch (err: any) {
        if (err?.response?.status === 429 && i < retries) {
          await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
          continue;
        }
        throw err;
      }
    }
  };

  useEffect(() => {
    fetchWithRetry('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit: 12, sort };
    if (category) params.category = category;
    if (gender) params.gender = gender;
    if (search) params.search = search;
    if (size) params.size = size;
    if (color) params.color = color;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    fetchWithRetry('/products', { params }).then(r => {
      setProducts(r.data.products);
      setTotal(r.data.total);
      setPages(r.data.pages);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category, search, sort, gender, size, color, minPrice, maxPrice]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <AnimatedPage>
      <SEOHead
        title={`${search ? `"${search}" results` : category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Shop All'} | FANCLUB — Fandom Streetwear`}
        description={`Browse ${total} ${category || 'fandom-inspired'} products at FANCLUB. Premium streetwear from ₹499. Free shipping & taxes included. ${gender ? `For ${gender.toLowerCase()}.` : ''}`}
        keywords={`FANCLUB shop, ${category || 'streetwear'}, fandom fashion, buy online India, ${gender || 'unisex'}`}
        jsonLd={[
          buildCollectionSchema(
            `${category || 'All Products'} — FANCLUB`,
            `Shop ${total} fandom-inspired fashion products at FANCLUB`
          ),
          buildBreadcrumbSchema([
            { name: 'Home', url: window.location.origin },
            { name: 'Shop', url: `${window.location.origin}/shop` },
            ...(category ? [{ name: category.charAt(0).toUpperCase() + category.slice(1), url: window.location.href }] : []),
          ]),
        ]}
      />
      <div className="shop-page" id="shop-page">
        <div className="container">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: 'Shop', href: '/shop' },
            ...(category ? [{ label: category.charAt(0).toUpperCase() + category.slice(1) }] : []),
            ...(search ? [{ label: `"${search}"` }] : []),
          ]} />
          {/* Header */}
          <motion.div
            className="shop-header fandomtic-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shop-header-copy">
              <h1 className="heading-lg">
                {gender ? (gender === 'MEN' ? 'Men' : 'Women') : ''} {category ? category.charAt(0).toUpperCase() + category.slice(1) : search ? `Results: "${search}"` : (gender ? 'Collection' : 'Shop All')}
              </h1>
              <p className="text-muted">{total} products</p>
            </div>
            <div className="shop-controls">
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field shop-sort"
                id="shop-sort"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="name">Name</option>
              </select>
              <button className={`btn btn-secondary btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                <Grid3X3 size={18} />
              </button>
              <button className={`btn btn-secondary btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                <LayoutList size={18} />
              </button>
              <button className="btn btn-secondary filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
                <SlidersHorizontal size={18} /> Filters
              </button>
            </div>
          </motion.div>

          <div className="shop-layout">
            {/* Mobile / Tablet Filter Bottom Sheet */}
            {!isDesktop ? (
              <>
                <div 
                  className={`mobile-bottom-sheet-overlay ${filtersOpen ? 'active' : ''}`}
                  onClick={() => setFiltersOpen(false)}
                />
                <div className={`mobile-bottom-sheet ${filtersOpen ? 'active' : ''}`}>
                  <div className="mobile-bottom-sheet-header">
                    <h3 className="mobile-bottom-sheet-title">Filters</h3>
                    <button className="mobile-bottom-sheet-close" onClick={() => setFiltersOpen(false)}>
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mobile-bottom-sheet-content">
                    {/* Render all filters */}
                    <div className="filter-group">
                      <h4 className="filter-title">Gender</h4>
                      <div className="filter-chips">
                        <button className={`filter-chip ${!gender ? 'active' : ''}`} onClick={() => updateFilter('gender', '')}>All</button>
                        <button className={`filter-chip ${gender === 'MEN' ? 'active' : ''}`} onClick={() => updateFilter('gender', 'MEN')}>Men</button>
                        <button className={`filter-chip ${gender === 'WOMEN' ? 'active' : ''}`} onClick={() => updateFilter('gender', 'WOMEN')}>Women</button>
                      </div>
                    </div>

                    <div className="filter-group" style={{ marginTop: '20px' }}>
                      <h4 className="filter-title">Categories</h4>
                      <div className="filter-chips">
                        <button className={`filter-chip ${!category ? 'active' : ''}`} onClick={() => updateFilter('category', '')}>All</button>
                        {categories.map((cat: any) => (
                          <button
                            key={cat.id}
                            className={`filter-chip ${category === cat.slug ? 'active' : ''}`}
                            onClick={() => updateFilter('category', cat.slug)}
                          >
                            {cat.name} ({cat._count?.products || 0})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="filter-group" style={{ marginTop: '20px' }}>
                      <h4 className="filter-title">Size</h4>
                      <div className="filter-chips">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                          <button key={s} className={`filter-chip ${size === s ? 'active' : ''}`} onClick={() => updateFilter('size', size === s ? '' : s)}>{s}</button>
                        ))}
                      </div>
                    </div>

                    <div className="filter-group" style={{ marginTop: '20px' }}>
                      <h4 className="filter-title">Color</h4>
                      <div className="filter-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Black', 'White', 'Red', 'Blue', 'Yellow'].map(c => (
                          <button 
                            key={c} 
                            title={c}
                            onClick={() => updateFilter('color', color === c ? '' : c)}
                            style={{ 
                              width: '28px', height: '28px', borderRadius: '50%', background: c.toLowerCase(), 
                              border: color === c ? '3px solid var(--bauhaus-red)' : '2px solid var(--bauhaus-black)',
                              cursor: 'pointer' 
                            }} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="filter-group" style={{ marginTop: '20px', marginBottom: '20px' }}>
                      <h4 className="filter-title">Price Range</h4>
                      <div className="filter-chips">
                        <button className={`filter-chip ${!minPrice && !maxPrice ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}>All</button>
                        <button className={`filter-chip ${maxPrice === '999' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', '999'); }}>Under ₹999</button>
                        <button className={`filter-chip ${minPrice === '1000' && maxPrice === '2999' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', '1000'); updateFilter('maxPrice', '2999'); }}>₹1000 - ₹2999</button>
                        <button className={`filter-chip ${minPrice === '3000' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', '3000'); updateFilter('maxPrice', ''); }}>Above ₹3000</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Desktop Sidebar */
              <motion.aside
                className={`shop-sidebar glass-card fandomtic-panel ${filtersOpen ? 'open' : ''}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <div className="sidebar-header">
                  <h3 className="heading-sm">Filters</h3>
                  <button className="btn-icon sidebar-close" onClick={() => setFiltersOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="filter-group">
                  <h4 className="filter-title">Gender</h4>
                  <div className="filter-chips">
                    <button className={`filter-chip ${!gender ? 'active' : ''}`} onClick={() => updateFilter('gender', '')}>All</button>
                    <button className={`filter-chip ${gender === 'MEN' ? 'active' : ''}`} onClick={() => updateFilter('gender', 'MEN')}>Men</button>
                    <button className={`filter-chip ${gender === 'WOMEN' ? 'active' : ''}`} onClick={() => updateFilter('gender', 'WOMEN')}>Women</button>
                  </div>
                </div>

                <div className="filter-group">
                  <h4 className="filter-title">Categories</h4>
                  <div className="filter-chips">
                    <button className={`filter-chip ${!category ? 'active' : ''}`} onClick={() => updateFilter('category', '')}>All</button>
                    {categories.map((cat: any) => (
                      <button
                        key={cat.id}
                        className={`filter-chip ${category === cat.slug ? 'active' : ''}`}
                        onClick={() => updateFilter('category', cat.slug)}
                      >
                        {cat.name} ({cat._count?.products || 0})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group" style={{ marginTop: '24px' }}>
                  <h4 className="filter-title">Size</h4>
                  <div className="filter-chips">
                    {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                      <button key={s} className={`filter-chip ${size === s ? 'active' : ''}`} onClick={() => updateFilter('size', size === s ? '' : s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="filter-group" style={{ marginTop: '24px' }}>
                  <h4 className="filter-title">Color</h4>
                  <div className="filter-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Black', 'White', 'Red', 'Blue', 'Yellow'].map(c => (
                      <button 
                        key={c} 
                        title={c}
                        onClick={() => updateFilter('color', color === c ? '' : c)}
                        style={{ 
                          width: '28px', height: '28px', borderRadius: '50%', background: c.toLowerCase(), 
                          border: color === c ? '3px solid var(--bauhaus-red)' : '2px solid var(--bauhaus-black)',
                          cursor: 'pointer' 
                        }} 
                      />
                    ))}
                  </div>
                </div>

                <div className="filter-group" style={{ marginTop: '24px' }}>
                  <h4 className="filter-title">Price Range</h4>
                  <div className="filter-chips">
                    <button className={`filter-chip ${!minPrice && !maxPrice ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}>All</button>
                    <button className={`filter-chip ${maxPrice === '999' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', '999'); }}>Under ₹999</button>
                    <button className={`filter-chip ${minPrice === '1000' && maxPrice === '2999' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', '1000'); updateFilter('maxPrice', '2999'); }}>₹1000 - ₹2999</button>
                    <button className={`filter-chip ${minPrice === '3000' ? 'active' : ''}`} onClick={() => { updateFilter('minPrice', '3000'); updateFilter('maxPrice', ''); }}>Above ₹3000</button>
                  </div>
                </div>
              </motion.aside>
            )}

            {/* Products */}
            <div className="shop-products">
              {!isDesktop && (
                <div className="mobile-pills-row" style={{ padding: '0 0 16px 0', margin: '0 0 8px 0' }}>
                  <button className={`mobile-pill ${!category ? 'active' : ''}`} onClick={() => updateFilter('category', '')}>All</button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      className={`mobile-pill ${category === cat.slug ? 'active' : ''}`}
                      onClick={() => updateFilter('category', cat.slug)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="shop-loading"
                    className="product-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="product-card-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }} />
                        <div className="skeleton" style={{ height: '16px', width: '40%', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ height: '24px', width: '80%', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ height: '20px', width: '30%', borderRadius: '4px' }} />
                      </div>
                    ))}
                  </motion.div>
                ) : products.length === 0 ? (
                  <motion.div
                    key="shop-empty"
                    className="shop-empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="heading-md">No products found</h3>
                    <p className="text-muted">Try adjusting your filters or search.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`shop-grid-${viewMode}-${page}-${category}-${search}-${sort}`}
                    className={viewMode === 'grid' ? 'product-grid' : 'product-list'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {products.map((p: any) => (
                      <div key={p.id} className="shop-product-item">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pagination */}
              {pages > 1 && (
                <motion.div
                  className="pagination"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i + 1}
                      className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateFilter('page', String(i + 1))}
                    >
                      {i + 1}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
