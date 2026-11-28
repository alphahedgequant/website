"use client";
// Quant Terminal "ANALYTICS" tab: Options Intelligence first, the earlier summary kept as a tab.
import { useState } from "react";
import OptionsIntelligence from "./OptionsIntelligence";
import { TerminalOptionAnalytics } from "@/components/TerminalOperationalTabs";

export default function TerminalOptionsIntel({ symbol, setSymbol, chain, chainError, onRefresh }) {
  const [tab, setTab] = useState("story");
  return (
    <div className="qt-integrated-app" data-terminal-panel="ANALYTICS" style={{ padding: 8 }}>
      <OptionsIntelligence symbol={symbol} onSymbol={setSymbol} tab={tab} onTab={setTab} hotkey={false}
        otherTabs={[{ id: "classic", label: "Classic summary" }]}
        renderOther={id => id === "classic" && <TerminalOptionAnalytics symbol={symbol} chain={chain} chainError={chainError} onRefresh={onRefresh} />} />
    </div>
  );
}
