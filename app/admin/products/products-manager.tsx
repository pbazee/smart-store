"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { deleteAdminProductsAction } from "@/app/admin/products/actions";
import { ProductFormDialog } from "@/app/admin/products/product-form-dialog";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";
import type { Product } from "@/types";

type ProductsManagerProps = {
  initialProducts: Product[];
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

export function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Product["category"]>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !deferredSearch.trim() ||
        [product.name, product.slug, product.description, product.subcategory]
          .join(" ")
          .toLowerCase()
          .includes(deferredSearch.trim().toLowerCase());

      const matchesCategory = category === "all" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, deferredSearch, products]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [category, deferredSearch]);

  const handleSavedProduct = (product: Product) => {
    startTransition(() => {
      setProducts((current) => {
        const exists = current.some((item) => item.id === product.id);
        if (exists) {
          return current.map((item) => (item.id === product.id ? product : item));
        }

        return [product, ...current];
      });
    });
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      ids.length === 1
        ? "Delete this product from the catalog?"
        : `Delete ${ids.length} selected products from the catalog?`
    );

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminProductsAction(ids);
          setProducts((current) => current.filter((product) => !ids.includes(product.id)));
          setRowSelection({});
          toast({
            title: ids.length === 1 ? "Product deleted" : "Products deleted",
            description:
              ids.length === 1
                ? "The product was removed from the catalog."
                : `${ids.length} products were removed from the catalog.`,
          });
        } catch (error) {
          toast({
            title: "Delete failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
          />
        ),
        enableSorting: false,
      },
      {
        id: "image",
        header: "Image",
        cell: ({ row }) => (
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-zinc-800">
            <Image
              src={row.original.images[0]}
              alt={row.original.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="font-semibold text-zinc-100">{row.original.name}</p>
            <p className="text-xs text-zinc-500">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "basePrice",
        header: "Price (KES)",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-zinc-100">
            {formatKES(row.original.basePrice)}
          </span>
        ),
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const stock = getTotalStock(row.original);
          return (
            <span
              className={`text-sm font-semibold ${
                stock <= 10 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {stock}
            </span>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold capitalize text-zinc-300">
            {row.original.category}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(row.original);
                setDialogOpen(true);
              }}
              className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete([row.original.id])}
              className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400"
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
    data: visibleProducts,
    columns,
    state: {
      rowSelection,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  const exportRows = () => {
    const rows =
      selectedIds.length > 0
        ? visibleProducts.filter((product) => selectedIds.includes(product.id))
        : visibleProducts;

    const csvRows = [
      ["Name", "Slug", "Category", "Subcategory", "Gender", "Base Price", "Stock", "Tags", "Images"].join(","),
      ...rows.map((product) =>
        [
          escapeCsv(product.name),
          escapeCsv(product.slug),
          escapeCsv(product.category),
          escapeCsv(product.subcategory),
          escapeCsv(product.gender),
          escapeCsv(product.basePrice),
          escapeCsv(getTotalStock(product)),
          escapeCsv(product.tags.join("|")),
          escapeCsv(product.images.join("|")),
        ].join(",")
      ),
    ];

    downloadCsv("smartest-store-products.csv", csvRows);
    toast({
      title: "CSV exported",
      description: `${rows.length} product${rows.length === 1 ? "" : "s"} exported.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Product control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Admin Products</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search, update, and launch catalog changes without database diving.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportRows}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0 || isPending}
            onClick={() => void handleDelete(selectedIds)}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 transition-colors hover:border-red-400 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Bulk delete
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Catalog size</p>
          <p className="mt-2 text-3xl font-black text-white">{products.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleProducts.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Selected rows</p>
          <p className="mt-2 text-3xl font-black text-white">{selectedIds.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, slug, description, or subcategory"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "clothes", "shoes", "accessories"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                category === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-zinc-400">
                    No products match the current search.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </p>

          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(event) =>
                setPagination((current) => ({
                  ...current,
                  pageSize: Number(event.target.value),
                  pageIndex: 0,
                }))
              }
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200"
            >
              {[8, 12, 20].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        product={editingProduct}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedProduct}
      />
    </div>
  );
}
