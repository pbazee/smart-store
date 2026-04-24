"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  deleteAdminProductsAction,
  deleteInvalidAdminProductsAction,
} from "@/app/admin/products/actions";
import { ProductFormDialog } from "@/app/admin/products/product-form-dialog";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";
import type { Product, Category } from "@/types";

type ProductsManagerProps = {
  initialProducts: Product[];
  totalProducts: number;
  page: number;
  limit: number;
  search?: string;
  categories: Category[];
  invalidProductCount: number;
};

function getTotalStock(product: Product) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, rows: string[]) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductsManager({
  initialProducts,
  totalProducts,
  page,
  limit,
  search: initialSearch = "",
  categories,
  invalidProductCount,
}: ProductsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [legacyProductCount, setLegacyProductCount] = useState(invalidProductCount);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalProducts / limit);

  // Sync products when initialProducts changes (e.g. on navigation)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    params.set("limit", limit.toString());
    if (searchInput) params.set("search", searchInput);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", limit.toString());
    if (searchInput) params.set("search", searchInput);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSavedProduct = (product: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      if (exists) {
        return current.map((item) => (item.id === product.id ? product : item));
      }
      return [product, ...current];
    });
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;

    if (!window.confirm(ids.length === 1 ? "Delete product?" : `Delete ${ids.length} products?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteAdminProductsAction(ids);
        setProducts((current) => current.filter((p) => !ids.includes(p.id)));
        setRowSelection({});
        toast({ title: "Deleted", description: `${ids.length} item(s) removed.` });
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      }
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500"
        />
      ),
    },
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-zinc-800">
          <Image src={row.original.images[0]} alt="" fill className="object-cover" />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="text-sm font-bold text-white truncate">{row.original.name}</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{row.original.subcategory}</p>
        </div>
      ),
    },
    {
      accessorKey: "basePrice",
      header: "Price",
      cell: ({ row }) => <span className="text-sm font-black text-white">{formatKES(row.original.basePrice)}</span>,
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = getTotalStock(row.original);
        const color = stock <= 5 ? "text-red-400 bg-red-400/10 border-red-500/20" : stock <= 15 ? "text-orange-400 bg-orange-400/10 border-orange-500/20" : "text-emerald-400 bg-emerald-400/10 border-emerald-500/20";
        return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${color}`}>{stock} Units</span>;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingProduct(row.original); setDialogOpen(true); }} className="p-2 border border-zinc-800 rounded-lg hover:border-orange-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete([row.original.id])} className="p-2 border border-zinc-800 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }
  ], [handleDelete]);

  const table = useReactTable({
    data: products,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Inventory Engine</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">{totalProducts} active records loaded</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { setEditingProduct(null); setDialogOpen(true); }} className="flex items-center gap-2 bg-orange-500 px-6 py-3 rounded-full text-sm font-black text-white shadow-[0_16px_32px_rgba(249,115,22,0.24)]">
                <Plus className="h-4 w-4" /> Launch Product
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Inventory</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalProducts}</h3>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selected Rows</p>
              <h3 className="text-3xl font-black text-white mt-1">{Object.keys(rowSelection).length}</h3>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Lookup by name or SKU..."
                className="w-full h-full bg-zinc-900/40 border border-zinc-800 rounded-[2rem] pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-orange-500/50"
              />
          </form>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                {table.getFlatHeaders().map((header) => (
                  <th key={header.id} className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="group hover:bg-zinc-800/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-8">
            <div className="flex items-center gap-4">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page {page} of {totalPages || 1}</p>
                <select 
                  value={limit} 
                  onChange={(e) => {
                      const newLimit = e.target.value;
                      router.push(`/admin/products?page=1&limit=${newLimit}${searchInput ? `&search=${searchInput}` : ""}`);
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-[10px] font-black text-zinc-400 rounded-full px-3 py-1 outline-none"
                >
                    {[10, 25, 50].map(v => <option key={v} value={v}>{v} / Page</option>)}
                </select>
            </div>
            <div className="flex gap-2">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-300 disabled:opacity-30">
                    <ChevronLeft className="h-3 w-3 inline mr-1" /> Prev
                </button>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || totalPages === 0} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-300 disabled:opacity-30">
                    Next <ChevronRight className="h-3 w-3 inline ml-1" />
                </button>
            </div>
        </div>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        product={editingProduct}
        categories={categories}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedProduct}
      />
    </div>
  );
}
