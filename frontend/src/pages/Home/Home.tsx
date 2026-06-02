import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  Square,
  Bell,
  Users,
  Star,
  Zap,
} from 'lucide-react';
import { Magnetic } from '../../components/Magnetic';
import AnimatedPage, { cinematicItem, cinematicStagger } from '../../components/AnimatedPage';
import ProductCard from '../../components/ProductCard/ProductCard';
import SEOHead from '../../components/SEOHead';
import { SOCIAL_LINKS } from '../../config';
import api from '../../lib/api';
import { formatImageUrl } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
}

const FEATURES = [
  { icon: Shield, label: 'Secure Payment', desc: '100% Secure Checkout' },
  { icon: Truck, label: 'Free Shipping', desc: 'On orders over ₹999' },
  { icon: RotateCcw, label: 'Easy Returns', desc: '14-day return policy' },
  { icon: Headphones, label: '24/7 Support', desc: 'Always here to help' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Product[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [featuredRes, dropsRes] = await Promise.all([
        api.get('/products/featured'),
        api.get('/products?sort=newest&limit=4'),
      ]);
      setFeatured(featuredRes.data?.products || featuredRes.data || []);
      setDrops(dropsRes.data?.products || dropsRes.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AnimatedPage className="bg-background min-h-screen pt-20">
      <SEOHead title="TFICLUB — Bauhaus Constructivist Streetwear" description="Premium geometric streetwear." />

      {/* 1. HERO - Two Panel Constructivist */}
      <section className="border-b-4 border-black grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
        {/* Left Panel */}
        <div className="p-8 lg:p-16 flex flex-col justify-center border-b-4 lg:border-b-0 lg:border-r-4 border-black relative z-10 bg-background">
          <motion.div initial="initial" animate="animate" variants={cinematicStagger} className="space-y-6">
            <motion.div variants={cinematicItem} className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 font-bold text-sm tracking-widest uppercase bg-white">
              <Square size={12} fill="currentColor" /> NEW COLLECTION
            </motion.div>
            
            <motion.h1 variants={cinematicItem} className="font-display font-black text-6xl lg:text-8xl leading-[0.9] tracking-tighter uppercase text-foreground">
              TFI<br/><span className="text-primary-red">CLUB</span>
            </motion.h1>
            
            <motion.p variants={cinematicItem} className="font-bold text-2xl uppercase tracking-wider">
              Be Your Own Style
            </motion.p>
            
            <motion.div variants={cinematicItem} className="pt-4">
              <Link to="/shop">
                <Button variant="primary" className="text-lg">
                  Explore Collection <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Panel - Blue Color Block */}
        <div className="bg-primary-blue relative p-8 lg:p-16 min-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Overlapping Geometric Composition */}
          <div className="absolute w-[300px] h-[300px] bg-primary-red rounded-full mix-blend-multiply opacity-80 animate-pulse" style={{ top: '10%', left: '10%' }} />
          <div className="absolute w-[250px] h-[250px] bg-primary-yellow border-4 border-black rotate-45" style={{ bottom: '15%', right: '20%' }} />
          
          <img 
            src="/assets/hero-banner.jpg" 
            alt="Hero" 
            className="relative z-10 w-3/4 max-w-md border-4 border-black shadow-lg grayscale hover:grayscale-0 transition-all duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </section>

      {/* 2. STATS - Yellow Block */}
      <section className="bg-primary-yellow border-b-4 border-black">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-4 sm:divide-y-0 sm:divide-x-4 divide-black border-x-4 border-black">
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <Users size={32} className="mb-4" />
              <div className="font-black text-4xl mb-2">10K+</div>
              <div className="font-bold uppercase tracking-wider text-sm">Customers</div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center bg-white">
              <Star size={32} className="mb-4" />
              <div className="font-black text-4xl mb-2">4.8</div>
              <div className="font-bold uppercase tracking-wider text-sm">Average Rating</div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <Shield size={32} className="mb-4" />
              <div className="font-black text-4xl mb-2">100%</div>
              <div className="font-bold uppercase tracking-wider text-sm">Genuine Products</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE */}
      <section className="py-16 lg:py-24 border-b-4 border-black relative">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="mb-12 border-l-8 border-primary-red pl-6">
            <h2 className="font-black text-4xl lg:text-6xl uppercase tracking-tighter">The Collection</h2>
            <p className="font-bold uppercase tracking-wider text-muted mt-2">Curated Drops</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.length > 0 ? (
              featured.map((product) => (
                <div key={product.id} className="bg-white border-4 border-black shadow-md p-4 hover:-translate-y-2 transition-transform duration-200">
                  <div className="relative aspect-[3/4] mb-4 border-2 border-black overflow-hidden">
                    <img src={formatImageUrl(product.images?.[0])} alt={product.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <h3 className="font-bold uppercase text-lg leading-tight mb-2 truncate">{product.name}</h3>
                  <div className="font-mono font-bold text-lg">₹{product.price}</div>
                  <Link to={`/product/${product.slug}`} className="mt-4 block">
                    <Button variant="outline" className="w-full">View</Button>
                  </Link>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border-4 border-black shadow-md p-4 h-96 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. FEATURES - Red Block */}
      <section className="bg-primary-red py-16 border-b-4 border-black text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feat, i) => (
              <div key={i} className="bg-white text-black border-4 border-black shadow-sm p-6 relative">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary-yellow border-2 border-black rounded-full flex items-center justify-center">
                  <feat.icon size={20} />
                </div>
                <h4 className="font-bold uppercase text-xl mb-2">{feat.label}</h4>
                <p className="font-medium">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. UPCOMING DROP - Blue Block */}
      <section className="bg-primary-blue py-16 border-b-4 border-black text-white relative overflow-hidden">
        {/* Geometric decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 border-[16px] border-primary-yellow rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <h2 className="font-black text-5xl lg:text-7xl uppercase tracking-tighter mb-6">Next Drop</h2>
          <div className="bg-white text-black border-4 border-black shadow-lg p-8 lg:p-12 max-w-3xl mx-auto rotate-1 hover:rotate-0 transition-transform">
            <h3 className="font-bold text-2xl lg:text-3xl uppercase mb-4">Cinema Collection V2</h3>
            <p className="font-medium text-lg mb-8">Exclusive designs inspired by blockbusters. Limited pieces.</p>
            <Link to="/shop">
              <Button variant="yellow" className="text-lg px-12">
                <Bell size={20} className="mr-2" /> Notify Me
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </AnimatedPage>
  );
}