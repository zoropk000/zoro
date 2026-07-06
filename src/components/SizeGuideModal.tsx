import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const rows = [
    { cm: "24.5", size: 39 },
    { cm: "25.0", size: 40 },
    { cm: "25.5", size: 41 },
    { cm: "26.0", size: 42 },
    { cm: "26.5", size: 43 },
    { cm: "27.0", size: 44 },
    { cm: "27.5", size: 45 },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Simple Size Guide</h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-foreground">
          <li>Put your foot on a piece of paper.</li>
          <li>Mark the back of your heel.</li>
          <li>Mark the tip of your longest toe.</li>
          <li>Measure the distance in centimeters.</li>
          <li>Match the measurement with the table below.</li>
        </ol>
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">Foot Length</th>
              <th className="py-2">Shoe Size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-b border-border/50">
                <td className="py-2">{r.cm} cm</td>
                <td className="py-2 font-semibold">{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-muted-foreground">
          Still confused? <Link to="/contact" className="font-semibold text-primary">Message us on WhatsApp</Link> for help.
        </p>
      </div>
    </div>
  );
}
