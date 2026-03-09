"use client";
import { useState } from "react";
import { mockProducts } from "@/lib/mock-data";
import { formatKES } from "@/lib/utils";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import Link from "next/link";

export default function AdminProducts() {
  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.category === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const totalStock = (product: Product) =>
    product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">Products</h1>
          <p className="text-zinc-400 text-sm">{filtered.length} products</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "shoes", "clothes"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === cat ? "bg-brand-500 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-100">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-sm">{formatKES(product.basePrice)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-semibold ${totalStock(product) <= 10 ? "text-amber-400" : "text-green-400"}`}>
                      {totalStock(product)} units
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      product.isNew ? "bg-brand-500/20 text-brand-400" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {product.isNew ? "New" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/product/${product.slug}`} target="_blank">
                        <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
