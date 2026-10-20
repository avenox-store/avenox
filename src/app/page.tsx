'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ hours: 13, minutes: 29, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickCategories = [
    { name: "Live Now", img: "https://images-eu.ssl-images-amazon.com/images/G/31/Events/img24/Jupiter24/Gateway/P3B/GIF_24_LiveNow_PC_CC_1x._SY304_CB562413125_.jpg" },
    { name: "Amazon Pay", img: "https://images-eu.ssl-images-amazon.com/images/G/31/AmazonPay/B2C/APay_Logo_PC._CB485934524_.png" },
    { name: "Mobiles", img: "https://images-eu.ssl-images-amazon.com/images/G/31/img24/Wireless/Madhav/Jupiter24/Phase1/D156384074_WL_Jup24_CentralHeader_PC_1x._CB541819779_.jpg" },
    { name: "Join Prime", img: "https://m.media-amazon.com/images/G/31/prime/marketing/p3b/Prime_logo._CB485934524_.png" },
    { name: "Bazaar", img: "https://images-eu.ssl-images-amazon.com/images/G/31/Bazaar/p3b/Bazaar_logo._CB485934524_.png" },
    { name: "Fashion", img: "https://images-eu.ssl-images-amazon.com/images/G/31/img24/Fashion/Jupiter24/Phase1/PC_CC_1x._SY304_CB541819779_.jpg" }
  ];

  const products = [
    {
      id: "iphone-16",
      title: "Apple iPhone 16 (128 GB) - White",
      rating: "4.5",
      reviews: "2,797",
      price: "76,999",
      mrp: "79,900",
      discount: "4%",
      bought: "5K+ bought in past month",
      delivery: "FREE delivery Thursday, 24 Oct",
      image: "https://m.media-amazon.com/images/I/71657TiFeHL._SX679_.jpg"
    },
    {
      id: "iphone-17-pro",
      title: "Apple iPhone 17 Pro (256 GB) - Cosmic Orange",
      rating: "4.7",
      reviews: "1,200",
      price: "1,29,900",
      mrp: "1,34,900",
      discount: "4%",
      bought: "1K+ bought in past month",
      delivery: "FREE delivery Friday, 25 Oct",
      image: "https://m.media-amazon.com/images/I/71657TiFeHL._SX679_.jpg"
    },
    {
      id: "samsung-s25-ultra",
      title: "Samsung Galaxy S25 Ultra 5G AI Smartphone",
      rating: "4.6",
      reviews: "3,542",
      price: "94,999",
      mrp: "1,29,999",
      discount: "27%",
      bought: "2K+ bought in past month",
      delivery: "FREE delivery Tomorrow",
      image: "https://m.media-amazon.com/images/I/71gebyP16dL._SX679_.jpg"
    },
    {
      id: "oneplus-n6",
      title: "OnePlus N6 (8GB RAM, 128GB Storage) Midnight Green",
      rating: "4.3",
      reviews: "1,432",
      price: "24,999",
      mrp: "33,999",
      discount: "26%",
      bought: "800+ bought in past month",
      delivery: "FREE delivery Thursday, 24 Oct",
      image: "https://m.media-amazon.com/images/I/617Mdn6S63L._SX679_.jpg"
    }
  ];

  return (
    <div className="bg-[#eaeded] min-h-screen text-slate-900 pb-12 font-sans">
      <header className="bg-[#131921] text-white">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight text-white flex items-center">
              amazon<span className="text-[#febd69] text-xs font-normal">.in</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-sm font-medium">Saikrishna &gt;</span>
            <div className="relative cursor-pointer">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 left-3.5 bg-[#febd69] text-black text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">4</span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-2.5">
          <div className="flex items-center bg-white rounded-md overflow-hidden shadow-sm h-11">
            <input
              type="text"
              placeholder="Search Amazon.in"
              className="flex-1 px-3 py-2 text-sm text-black outline-none"
            />
            <button className="bg-[#febd69] px-4 h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-[#232f3e] px-3 py-2 flex items-center gap-4 text-xs font-medium overflow-x-auto whitespace-nowrap text-gray-200">
          <span className="font-bold text-white">Shop By Category</span>
          <span>Deals</span>
          <span>Sell</span>
          <span>Amazon Pay</span>
          <span>Mobiles</span>
          <span>Prime</span>
        </div>

        <div className="bg-[#37475a] px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <svg className="w-4 h-4 text-[#febd69] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">Deliver to Saikrishna - Vengad 670612</span>
          </div>
          <button className="bg-[#007185] text-white px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap">Join Prime</button>
        </div>
      </header>

      <div className="relative bg-gradient-to-r from-orange-400 to-amber-500 overflow-hidden">
        <div className="px-4 py-6 text-white flex justify-between items-center">
          <div>
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Live Now</span>
            <h1 className="text-2xl font-black italic tracking-wide mt-1">Great Indian Festival</h1>
            <p className="text-xs text-yellow-100 font-medium">Bank Offer Ends Tonight | 10% Instant Discount*</p>
          </div>
          <div className="bg-[#131921]/90 rounded-lg p-2 text-center text-white border border-yellow-400">
            <p className="text-[10px] uppercase font-bold text-yellow-400">Bank offer ends in</p>
            <div className="flex gap-1 text-sm font-black mt-0.5">
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
              <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-3 px-2 grid grid-cols-6 gap-1 border-b border-gray-200">
        {quickCategories.map((c, i) => (
          <div key={i} className="flex flex-col items-center cursor-pointer text-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center p-1">
              <img src={c.img} alt={c.name} className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-medium text-gray-800 mt-1 truncate w-14">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#ff9900] px-4 py-2 flex items-center justify-between text-white font-bold text-sm mt-2">
        <span>Trending deals</span>
        <span>&gt;</span>
      </div>

      <div className="px-2 pt-2 space-y-2">
        {products.map((item) => (
          <div key={item.id} className="bg-white rounded p-3 shadow-sm border border-gray-200 flex flex-col">
            <div className="flex gap-3">
              <div className="w-32 h-36 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded p-1">
                <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Sponsored</span>
                <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{item.title}</h3>
                
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="text-[#007185] font-semibold">{item.rating} ★</span>
                  <span className="text-gray-500">({item.reviews})</span>
                </div>
                <p className="text-[11px] text-gray-600">{item.bought}</p>

                <div className="mt-1">
                  <span className="bg-[#cc0c39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded mr-1.5">{item.discount} off</span>
                  <span className="text-[10px] font-bold text-[#b12704] uppercase">Great Indian Festival</span>
                </div>

                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-gray-900 leading-tight">₹{item.price}</span>
                  <span className="text-xs text-gray-500 line-through">M.R.P: ₹{item.mrp}</span>
                </div>

                <p className="text-[11px] font-medium text-gray-800 mt-0.5">{item.delivery}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="bg-[#ffd814] hover:bg-[#f7ca00] text-black py-2 rounded-full font-medium text-xs shadow-sm text-center">
                Add to cart
              </button>
              <button className="bg-[#ffa41c] hover:bg-[#fa8900] text-black py-2 rounded-full font-medium text-xs shadow-sm text-center">
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-6 bg-[#232f3e] text-white text-xs text-center py-4 space-y-2">
        <a href="#" className="text-gray-300 font-medium block">TOP OF PAGE</a>
        <div className="border-t border-gray-600 pt-3 flex justify-center gap-4 text-gray-300">
          <span>Your Orders</span>
          <span>Amazon Pay</span>
          <span>Your Account</span>
          <span>Customer Service</span>
        </div>
        <p className="text-gray-400 text-[10px] pt-1">© 1996-2026, Amazon.com, Inc. or its affiliates</p>
      </footer>
    </div>
  );
}
