'use client';

import React, { useState } from 'react';
import { Product } from '../lib/types';
import { useCart } from '../context/AppContext';
import { Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    product.imgUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80'
  );

  const handleAdd = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group relative flex flex-col bg-white border border-zinc-200/80 rounded-2xl overflow-hidden hover:border-zinc-400 hover:shadow-xl transition-all duration-300">
      {/* Image Container with Aspect Square */}
      <div className="relative aspect-square w-full bg-zinc-50 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() =>
            setImgSrc('https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80')
          }
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Product ID Tag */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-zinc-600 border border-zinc-200/60 shadow-xs">
          ID #{product.id}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-sm text-zinc-900 group-hover:text-black line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">High-Performance Hardware</p>
        </div>

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-base font-black text-zinc-950 font-mono">
            ${product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAdd}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 hover:bg-black hover:text-white text-zinc-800'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
