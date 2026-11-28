"use client";
// AHQ Quant Terminal — command-driven, multi-pane workspace.
// terminal.css is kept for the embedded AHQ modules (options desk, scanner, backtester, research).
import "./terminal.css";
import TerminalShell from "@/components/terminal/TerminalShell";

export default function TerminalPage() {
  return <TerminalShell />;
}
