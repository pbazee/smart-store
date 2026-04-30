"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ProductFormDialog } from "@/app/admin/products/product-form-dialog";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { jsonFetcher } from "@/lib/fetcher";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";
import type { Category, Product } from "@/types";

type ProductsManagerProps = {
  initialProducts: Product[];
  totalProducts: number;
  page: number;
  limit: number;
  search?: string;
  categories: Category[];
  invalidProductCount: number;
};

type ProductsResponse = {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    search: string;
  };
};

function getTotalStock(product: Product) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

function buildProductsUrl(page: number, limit: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return `/api/admin/products?${params.toString()}`;
}

export function ProductsManager({
  initialProducts,
  totalProducts,
  page,
  limit,
  search: initialSearch = "",
  categories,
}: ProductsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [querySearch, setQuerySearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize, setPageSize] = useState(limit);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isPending, startTransition] = useTransition();

  const productsUrl = buildProductsUrl(currentPage, pageSize, querySearch);
  const { data, isLoading, isValidating, mutate } = useSWR<ProductsResponse>(
    productsUrl,
    jsonFetcher,
    {
      fallbackData: {
        success: true,
        data: initialProducts,
        meta: {
          page,
          limit,
          total: totalProducts,
          totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
          search: initialSearch,
        },
      },
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const products = data?.data ?? initialProducts;
  const meta = data?.meta ?? {
    page,
    limit,
    total: totalProducts,
    totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
    search: initialSearch,
  };

  useEffect(() => {
    setSearchInput(initialSearch);
    setQuerySearch(initialSearch);
    setCurrentPage(page);
    setPageSize(limit);
  }, [initialSearch, limit, page]);

  const syncUrl = (nextPage: number, nextLimit: number, nextSearch: string) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(nextLimit),
    });

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    router.replace(`/admin/products?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > meta.totalPages) {
      return;
    }

    setCurrentPage(nextPage);
    syncUrl(nextPage, pageSize, querySearch);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setCurrentPage(1);
    setQuerySearch(nextSearch);
    syncUrl(1, pageSize, nextSearch);
  };

  const handleSavedProduct = async () => {
    await mutate();
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    if (!window.confirm(ids.length === 1 ? "Delete product?" : `Delete ${ids.length} products?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await Promise.all(
          ids.map((id) =>
            jsonFetcher<{ success: boolean }>(`/api/admin/products/${id}`, {
              method: "DELETE",
            })
          )
        );
        setRowSelection({});
        await mutate();
        toast({ title: "Deleted", description: `${ids.length} item(s) removed.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      }
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
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
            <p className="truncate text-sm font-bold text-white">{row.original.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
              {row.original.subcategory}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "basePrice",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-sm font-black text-white">
            {formatKES(row.original.basePrice)}
          </span>
        ),
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const stock = getTotalStock(row.original);
          const color =
            stock <= 5
              ? "text-red-400 bg-red-400/10 border-red-500/20"
              : stock <= 15
                ? "text-orange-400 bg-orange-400/10 border-orange-500/20"
                : "text-emerald-400 bg-emerald-400/10 border-emerald-500/20";

          return (
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${color}`}>
              {stock} Units
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingProduct(row.original);
                setDialogOpen(true);
              }}
              className="rounded-lg border border-zinc-800 p-2 transition-colors hover:border-orange-500"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => void handleDelete([row.original.id])}
              className="rounded-lg border border-zinc-800 p-2 transition-colors hover:border-red-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

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
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            {meta.total} active records loaded
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(249,115,22,0.24)]"
          >
            <Plus className="h-4 w-4" /> Launch Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Total Inventory
          </p>
          <h3 className="mt-1 text-3xl font-black text-white">{meta.total}</h3>
        </div>
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Selected Rows
          </p>
          <h3 className="mt-1 text-3xl font-black text-white">
            {Object.keys(rowSelection).length}
          </h3>
        </div>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Lookup by name or SKU..."
            className="h-full w-full rounded-[2rem] border border-zinc-800 bg-zinc-900/40 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-orange-500/50"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl">
        {isLoading ? (
          <InlineLoader label="Loading products..." />
        ) : (
          <>
            {isValidating ? (
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Refreshing inventory...
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {table.getFlatHeaders().map((header) => (
                      <th
                        key={header.id}
                        className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-zinc-800/30">
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
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Page {meta.page} of {meta.totalPages || 1}
                </p>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    const nextLimit = Number(event.target.value);
                    setPageSize(nextLimit);
                    setCurrentPage(1);
                    syncUrl(1, nextLimit, querySearch);
                  }}
                  className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-black text-zinc-400 outline-none"
                >
                  {[20, 40, 60].map((value) => (
                    <option key={value} value={value}>
                      {value} / Page
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1 || isPending}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black text-zinc-300 disabled:opacity-30"
                >
                  <ChevronLeft className="mr-1 inline h-3 w-3" /> Prev
                </button>
                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.totalPages || meta.totalPages === 0 || isPending}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black text-zinc-300 disabled:opacity-30"
                >
                  Next <ChevronRight className="ml-1 inline h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}
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
