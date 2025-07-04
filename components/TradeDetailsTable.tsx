import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface TradeDetailsTableProps {
  rows: { label: string; value: string | number }[];
}

export const TradeDetailsTable: React.FC<TradeDetailsTableProps> = ({ rows }) => (
  <div className="rounded-xl border border-cyan-700/40 bg-zinc-950/80 overflow-hidden shadow-md">
    <Table>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.label + i} className="hover:bg-cyan-900/20 transition">
            <TableCell className="text-cyan-400 font-mono w-1/2">{row.label}</TableCell>
            <TableCell className="text-slate-50 font-mono w-1/2">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
); 