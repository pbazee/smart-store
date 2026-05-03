"use client";

import { Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const sizeRows = [
  ["XS", "84-88 cm", "66-70 cm", "88-92 cm"],
  ["S", "89-94 cm", "71-76 cm", "93-98 cm"],
  ["M", "95-100 cm", "77-82 cm", "99-104 cm"],
  ["L", "101-108 cm", "83-90 cm", "105-112 cm"],
  ["XL", "109-116 cm", "91-98 cm", "113-120 cm"],
];

export function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 text-xs font-semibold text-brand-500 hover:text-brand-600">
          <Ruler className="h-4 w-4" />
          Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-zinc-200 bg-white/95 p-4 text-zinc-950 shadow-2xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-left text-2xl font-black text-zinc-950 dark:text-zinc-50">
            Interactive Size Guide
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Built with Kenyan fit notes in mind. If you are between sizes, most Nairobi shoppers
            prefer sizing up for oversized streetwear and sizing true for fitted dresses.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">Find your size</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <li>1. Measure chest at the fullest point while standing naturally.</li>
              <li>2. Measure waist above the hipbone with relaxed posture.</li>
              <li>3. Measure hips around the fullest part of the seat.</li>
              <li>4. For sneakers, Nairobi customers usually size true unless wearing thick socks.</li>
            </ol>

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-100">
              <p className="font-semibold">Average fit insight</p>
              <p className="mt-1 leading-6">
                Streetwear pieces run relaxed. If you are shopping bombers, hoodies, or cargos for a
                boxier silhouette, one size up tends to feel best.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
            <table className="min-w-[420px] w-full text-sm">
              <thead className="bg-zinc-100 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                <tr>
                  {["Size", "Chest", "Waist", "Hip"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeRows.map((row) => (
                  <tr key={row[0]} className="border-t border-zinc-200 dark:border-zinc-800">
                    {row.map((cell, index) => (
                      <td key={cell} className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {index === 0 ? <span className="font-semibold text-zinc-950 dark:text-zinc-50">{cell}</span> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
