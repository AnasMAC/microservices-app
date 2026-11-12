'use client';

import React, { useState } from 'react';
import { Product } from '../lib/types';
import { useApp } from '../context/AppContext';
import { Plus, Check, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useApp();
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
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full bg-gray-50 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() =>
            setImgSrc('https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80')
          }
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-gray-700 shadow-xs">
          #{product.id}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500">Premium Tech Device</p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Price</span>
            <span className="text-lg font-black text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              added
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
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
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
