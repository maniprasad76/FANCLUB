import { useEffect, useState, useCallback } from "react";
import ProductCard from "../ProductCard/ProductCard";
import api from "../../lib/api";
import "./ProductShowcase.css";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  category?: { name: string; slug: string };
  newArrival?: boolean;
  bestseller?: boolean;
  description?: string;
}

interface ProductShowcaseProps {
  initialProducts?: Product[];
  title?: string;
  subtitle?: string;
}

export default function ProductShowcase({
  initialProducts,
  title,
  subtitle = "Latest",
}: ProductShowcaseProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [newArrRes, allRes] = await Promise.all([
        api.get("/products/new-arrivals").catch(() => ({ data: [] })),
        api.get("/products?sort=newest&limit=10").catch(() => ({ data: {} })),
      ]);

      const newArrList = Array.isArray(newArrRes.data)
        ? newArrRes.data
        : newArrRes.data?.products || [];
      const allList =
        allRes.data?.products || (Array.isArray(allRes.data) ? allRes.data : []);

      const list = newArrList.length > 0 ? newArrList : allList;
      setProducts(list);
    } catch {
      /* fallback silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, [initialProducts, fetchProducts]);

  return (
    <section className="clean-showcase-section">
      <div className="clean-showcase-container">
        {/* Section Header matching Curated Collection exact font and UI style */}
        <div className="section-header" style={{ marginBottom: "40px" }}>
          <p className="section-subtitle">{subtitle}</p>
          <h2 className="section-title">
            {title ? (
              title
            ) : (
              <>
                NEW <span className="text-gradient">ARRIVALS</span>
              </>
            )}
          </h2>
          <div className="section-divider" />
        </div>

        {/* 5-Column Product Grid */}
        <div className="clean-products-grid">
          {loading
            ? Array.from({ length: 10 }).map((_, idx) => (
                <div key={`skel-${idx}`} className="clean-skeleton-card">
                  <div className="clean-skeleton-img" />
                  <div className="clean-skeleton-line short" />
                  <div className="clean-skeleton-line price" />
                </div>
              ))
            : products.length > 0
            ? products.slice(0, 10).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="clean"
                />
              ))
            : (
                <div className="clean-empty-state">
                  <p>No products added yet. Add products in the Admin Panel to showcase them here!</p>
                </div>
              )}
        </div>
      </div>
    </section>
  );
}
