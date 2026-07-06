import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/size-guide")({
  head: () => ({ meta: [{ title: "Size Guide - StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-extrabold">Simple Size Guide</h1>
        <p className="mb-6 text-muted-foreground">
          Finding the right size is easy. Just follow these steps:
        </p>
        <ol className="mb-6 list-inside list-decimal space-y-2 text-foreground">
          <li>Put your foot on a piece of paper.</li>
          <li>Mark the back of your heel.</li>
          <li>Mark the tip of your longest toe.</li>
          <li>Measure the distance in centimeters.</li>
          <li>Match the measurement with the table below.</li>
        </ol>
        <table className="w-full overflow-hidden rounded-2xl border border-border text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="p-3 text-left">Foot Length</th>
              <th className="p-3 text-left">Shoe Size</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["23.5 cm", "37"],
              ["24.0 cm", "38"],
              ["24.5 cm", "39"],
              ["25.0 cm", "40"],
              ["25.5 cm", "41"],
              ["26.0 cm", "42"],
              ["26.5 cm", "43"],
              ["27.0 cm", "44"],
              ["27.5 cm", "45"],
            ].map(([cm, s]) => (
              <tr key={s} className="border-t border-border">
                <td className="p-3">{cm}</td>
                <td className="p-3 font-semibold">{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-sm text-muted-foreground">
          Still confused? Message us on WhatsApp for personal help.
        </p>
      </div>
    </Layout>
  ),
});
