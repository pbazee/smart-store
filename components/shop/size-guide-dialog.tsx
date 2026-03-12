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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Interactive Size Guide</DialogTitle>
          <DialogDescription>
            Built with Kenyan fit notes in mind. If you are between sizes, most Nairobi shoppers
            prefer sizing up for oversized streetwear and sizing true for fitted dresses.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-3xl border border-border bg-muted/40 p-5">
            <h3 className="font-semibold">Find your size</h3>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>1. Measure chest at the fullest point while standing naturally.</li>
              <li>2. Measure waist above the hipbone with relaxed posture.</li>
              <li>3. Measure hips around the fullest part of the seat.</li>
              <li>4. For sneakers, Nairobi customers usually size true unless wearing thick socks.</li>
            </ol>

            <div className="mt-6 rounded-2xl border border-brand-300/30 bg-brand-500/10 p-4 text-sm text-brand-700 dark:text-brand-200">
              <p className="font-semibold">Average fit insight</p>
              <p className="mt-1">
                Streetwear pieces run relaxed. If you are shopping bombers, hoodies, or cargos for a
                boxier silhouette, one size up tends to feel best.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
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
                  <tr key={row[0]} className="border-t border-border">
                    {row.map((cell, index) => (
                      <td key={cell} className="px-4 py-3">
                        {index === 0 ? <span className="font-semibold">{cell}</span> : cell}
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
