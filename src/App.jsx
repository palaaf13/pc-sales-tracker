import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Search,
  ArrowLeft,
  DollarSign,
  Boxes,
  TrendingUp,
  TrendingDown,
  Settings,
  Upload,
  Download,
} from "lucide-react";

// PC Build Expense Tracker
// Single-file React app (no backend). Data persists in localStorage.
// Replace the placeholder logo with your own by uploading an image in-app.

const LS_KEY = "pc_expense_tracker_v1";

const PART_STATUS = {
  BOUGHT: "Bought",
  NEEDED: "Needed",
  NA: "N/A",
};

const DEFAULT_PARTS = [
  "CPU",
  "GPU",
  "Motherboard",
  "RAM",
  "Storage",
  "PSU",
  "Case",
  "CPU Cooler",
  "Case Fans",
  "WiFi/Bluetooth",
  "Cables/Adapters",
  "Other",
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeBuildTotals(build) {
  const expenses = (build.expenses || []).reduce((sum, e) => sum + safeNumber(e.amount), 0);
  const soldFor = safeNumber(build.soldFor);
  const profit = soldFor - expenses;
  return { expenses, soldFor, profit };
}

function createEmptyBuild() {
  const parts = DEFAULT_PARTS.map((name) => ({
    id: uid(),
    name,
    status: PART_STATUS.NEEDED,
    cost: "",
    notes: "",
    source: "",
  }));

  return {
    id: uid(),
    name: "New Build",
    platform: "",
    notes: "",
    createdAt: new Date().toISOString(),
    soldAt: "",
    soldFor: "",
    expenses: [
      {
        id: uid(),
        label: "Initial parts",
        amount: "",
        category: "Parts",
        date: new Date().toISOString().slice(0, 10),
      },
    ],
    parts,
  };
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Button({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    subtle: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {Icon ? (
          <div className="mt-0.5 rounded-xl bg-zinc-100 p-2">
            <Icon className="h-4 w-4 text-zinc-800" />
          </div>
        ) : null}
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          {subtitle ? <div className="text-xs text-zinc-500">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

function LogoCorner({ logoDataUrl }) {
  return (
    <div className="absolute right-4 top-4">
      <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {logoDataUrl ? (
          <img src={logoDataUrl} alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-lg bg-zinc-200" />
        )}
        <div className="text-xs font-semibold text-zinc-900">Build Tracker</div>
      </div>
    </div>
  );
}

function ProfitBadge({ profit }) {
  if (profit > 0) {
    return (
      <Pill tone="good">
        <TrendingUp className="h-3.5 w-3.5" /> {money(profit)}
      </Pill>
    );
  }
  if (profit < 0) {
    return (
      <Pill tone="bad">
        <TrendingDown className="h-3.5 w-3.5" /> {money(profit)}
      </Pill>
    );
  }
  return (
    <Pill tone="neutral">
      <DollarSign className="h-3.5 w-3.5" /> {money(profit)}
    </Pill>
  );
}

function App() {
  const [data, setData] = useState(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallthrough
      }
    }

    const starter = {
      logoDataUrl: "",
      builds: [
        {
          ...createEmptyBuild(),
          name: "Sample Build (Edit Me)",
          notes: "Use this to track parts + expenses + profit.",
        },
      ],
    };

    return starter;
  });

  const [view, setView] = useState("list"); // list | details | analytics | settings
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("Newest");

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data]);

  const selectedBuild = useMemo(() => {
    return data.builds.find((b) => b.id === selectedId) || null;
  }, [data.builds, selectedId]);

  const totals = useMemo(() => {
    return data.builds.map((b) => ({ id: b.id, name: b.name, ...computeBuildTotals(b) }));
  }, [data.builds]);

  const analytics = useMemo(() => {
    const totalSpent = totals.reduce((s, t) => s + t.expenses, 0);
    const totalRevenue = totals.reduce((s, t) => s + t.soldFor, 0);
    const totalProfit = totals.reduce((s, t) => s + t.profit, 0);

    const soldCount = data.builds.filter((b) => safeNumber(b.soldFor) > 0).length;
    const openCount = data.builds.length - soldCount;

    return {
      totalSpent,
      totalRevenue,
      totalProfit,
      soldCount,
      openCount,
    };
  }, [data.builds, totals]);

  const filteredBuilds = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.builds;

    if (q) {
      list = list.filter((b) => {
        const hay = `${b.name} ${b.platform || ""} ${b.notes || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortMode === "Newest") {
      list = [...list].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    if (sortMode === "Oldest") {
      list = [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    }

    if (sortMode === "Highest Profit") {
      list = [...list].sort((a, b) => computeBuildTotals(b).profit - computeBuildTotals(a).profit);
    }

    if (sortMode === "Most Spent") {
      list = [...list].sort((a, b) => computeBuildTotals(b).expenses - computeBuildTotals(a).expenses);
    }

    return list;
  }, [data.builds, query, sortMode]);

  function updateBuild(id, patch) {
    setData((prev) => ({
      ...prev,
      builds: prev.builds.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }

  function deleteBuild(id) {
    setData((prev) => ({
      ...prev,
      builds: prev.builds.filter((b) => b.id !== id),
    }));
    setSelectedId(null);
    setView("list");
  }

  function addBuild() {
    const b = createEmptyBuild();
    setData((prev) => ({ ...prev, builds: [b, ...prev.builds] }));
    setSelectedId(b.id);
    setView("details");
  }

  function addExpense(buildId) {
    const exp = {
      id: uid(),
      label: "New expense",
      amount: "",
      category: "Parts",
      date: new Date().toISOString().slice(0, 10),
    };

    updateBuild(buildId, {
      expenses: [exp, ...(selectedBuild?.expenses || [])],
    });
  }

  function updateExpense(buildId, expenseId, patch) {
    const next = (selectedBuild?.expenses || []).map((e) => (e.id === expenseId ? { ...e, ...patch } : e));
    updateBuild(buildId, { expenses: next });
  }

  function deleteExpense(buildId, expenseId) {
    const next = (selectedBuild?.expenses || []).filter((e) => e.id !== expenseId);
    updateBuild(buildId, { expenses: next });
  }

  function updatePart(buildId, partId, patch) {
    const next = (selectedBuild?.parts || []).map((p) => (p.id === partId ? { ...p, ...patch } : p));
    updateBuild(buildId, { parts: next });
  }

  function addCustomPart(buildId) {
    const p = {
      id: uid(),
      name: "Custom Part",
      status: PART_STATUS.NEEDED,
      cost: "",
      notes: "",
      source: "",
    };

    updateBuild(buildId, { parts: [p, ...(selectedBuild?.parts || [])] });
  }

  function deletePart(buildId, partId) {
    const next = (selectedBuild?.parts || []).filter((p) => p.id !== partId);
    updateBuild(buildId, { parts: next });
  }

  function handleLogoUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({ ...prev, logoDataUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pc-build-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        if (!obj || typeof obj !== "object") return;
        if (!Array.isArray(obj.builds)) return;

        setData({
          logoDataUrl: obj.logoDataUrl || "",
          builds: obj.builds,
        });
        setView("list");
        setSelectedId(null);
      } catch {
        alert("Invalid JSON file.");
      }
    };

    reader.readAsText(file);
  }

  const bg =
    "bg-gradient-to-br from-zinc-50 via-white to-zinc-100 min-h-screen text-zinc-900";

  return (
    <div className={bg}>
      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <LogoCorner logoDataUrl={data.logoDataUrl} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight">PC Build Expense Tracker</div>
            <div className="text-sm text-zinc-600">
              Track parts, expenses, sold price, and profit/loss.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={view === "list" ? "primary" : "subtle"} onClick={() => setView("list")}
              >Builds</Button
            >
            <Button
              variant={view === "analytics" ? "primary" : "subtle"}
              onClick={() => setView("analytics")}
            >
              Analytics
            </Button>
            <Button
              variant={view === "settings" ? "primary" : "subtle"}
              onClick={() => setView("settings")}
            >
              <Settings className="h-4 w-4" /> Settings
            </Button>
            <Button onClick={addBuild}>
              <Plus className="h-4 w-4" /> New Build
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              <div className="lg:col-span-2">
                <Card className="p-4">
                  <SectionTitle
                    icon={Boxes}
                    title="Your Builds"
                    subtitle="Click a build to open details."
                    right={
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search builds..."
                            className="w-56 rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-400"
                          />
                        </div>
                        <select
                          value={sortMode}
                          onChange={(e) => setSortMode(e.target.value)}
                          className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                        >
                          {["Newest", "Oldest", "Highest Profit", "Most Spent"].map((s) => (
                            <option key={s} value={s}>
                              Sort: {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    }
                  />

                  <div className="space-y-2">
                    {filteredBuilds.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                        No builds found.
                      </div>
                    ) : null}

                    {filteredBuilds.map((b) => {
                      const t = computeBuildTotals(b);
                      const boughtCount = (b.parts || []).filter((p) => p.status === PART_STATUS.BOUGHT).length;
                      const neededCount = (b.parts || []).filter((p) => p.status === PART_STATUS.NEEDED).length;

                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedId(b.id);
                            setView("details");
                          }}
                          className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-zinc-900">{b.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {b.platform ? `Platform: ${b.platform}` : "No platform set"}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Pill tone="info">Spent: {money(t.expenses)}</Pill>
                                <Pill tone="neutral">Sold: {money(t.soldFor)}</Pill>
                                <ProfitBadge profit={t.profit} />
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Pill tone={neededCount > 0 ? "warn" : "good"}>
                                Parts: {boughtCount} bought / {neededCount} needed
                              </Pill>
                              <div className="text-xs text-zinc-500">
                                {b.createdAt ? `Created ${b.createdAt.slice(0, 10)}` : ""}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-4">
                  <SectionTitle
                    icon={DollarSign}
                    title="Quick Summary"
                    subtitle="All builds combined"
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                      <div className="text-sm text-zinc-700">Total Spent</div>
                      <div className="text-sm font-semibold">{money(analytics.totalSpent)}</div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                      <div className="text-sm text-zinc-700">Total Revenue</div>
                      <div className="text-sm font-semibold">{money(analytics.totalRevenue)}</div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                      <div className="text-sm text-zinc-700">Total Profit</div>
                      <div className="text-sm font-semibold">{money(analytics.totalProfit)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200">
                        <div className="text-xs text-zinc-500">Sold Builds</div>
                        <div className="text-lg font-semibold">{analytics.soldCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200">
                        <div className="text-xs text-zinc-500">Open Builds</div>
                        <div className="text-lg font-semibold">{analytics.openCount}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-zinc-300 p-3 text-xs text-zinc-600">
                      Tip: Track taxes/shipping as expenses so your profit numbers are accurate.
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : null}

          {view === "details" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!selectedBuild ? (
                <Card className="p-6">
                  <div className="text-sm text-zinc-700">No build selected.</div>
                  <div className="mt-3">
                    <Button variant="subtle" onClick={() => setView("list")}
                      >Back</Button
                    >
                  </div>
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="subtle" onClick={() => setView("list")}>
                      <ArrowLeft className="h-4 w-4" /> Back to Builds
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm("Delete this build? This cannot be undone.")) {
                            deleteBuild(selectedBuild.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Build
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                      <Card className="p-4">
                        <SectionTitle
                          icon={Boxes}
                          title="Build Details"
                          subtitle="Name, platform, notes"
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <TextInput
                            label="Build Name"
                            value={selectedBuild.name}
                            onChange={(v) => updateBuild(selectedBuild.id, { name: v })}
                            placeholder="RTX 4070 White Build"
                          />
                          <TextInput
                            label="Platform"
                            value={selectedBuild.platform}
                            onChange={(v) => updateBuild(selectedBuild.id, { platform: v })}
                            placeholder="Ryzen / Intel / AM4 / LGA1700"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="block">
                            <div className="mb-1 text-xs font-medium text-zinc-600">Notes</div>
                            <textarea
                              value={selectedBuild.notes}
                              onChange={(e) => updateBuild(selectedBuild.id, { notes: e.target.value })}
                              placeholder="Any notes about this build..."
                              className="min-h-[90px] w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                            />
                          </label>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <SectionTitle
                          icon={DollarSign}
                          title="Expenses"
                          subtitle="Add/remove expenses for this build"
                          right={
                            <Button variant="subtle" onClick={() => addExpense(selectedBuild.id)}>
                              <Plus className="h-4 w-4" /> Add Expense
                            </Button>
                          }
                        />

                        <div className="space-y-2">
                          {(selectedBuild.expenses || []).length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-600">
                              No expenses yet.
                            </div>
                          ) : null}

                          {(selectedBuild.expenses || []).map((e) => (
                            <div
                              key={e.id}
                              className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 sm:grid-cols-12"
                            >
                              <div className="sm:col-span-4">
                                <TextInput
                                  label="Label"
                                  value={e.label}
                                  onChange={(v) => updateExpense(selectedBuild.id, e.id, { label: v })}
                                  placeholder="GPU purchase"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <TextInput
                                  label="Amount ($)"
                                  type="number"
                                  value={e.amount}
                                  onChange={(v) => updateExpense(selectedBuild.id, e.id, { amount: v })}
                                  placeholder="0"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <Select
                                  label="Category"
                                  value={e.category}
                                  onChange={(v) => updateExpense(selectedBuild.id, e.id, { category: v })}
                                  options={["Parts", "Shipping", "Tax", "Tools", "Repairs", "Other"]}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <TextInput
                                  label="Date"
                                  type="date"
                                  value={e.date || ""}
                                  onChange={(v) => updateExpense(selectedBuild.id, e.id, { date: v })}
                                />
                              </div>

                              <div className="sm:col-span-1 flex items-end justify-end">
                                <Button
                                  variant="ghost"
                                  onClick={() => deleteExpense(selectedBuild.id, e.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <SectionTitle
                          icon={Boxes}
                          title="Parts Checklist"
                          subtitle="Track Bought / Needed / N/A"
                          right={
                            <Button variant="subtle" onClick={() => addCustomPart(selectedBuild.id)}>
                              <Plus className="h-4 w-4" /> Add Part
                            </Button>
                          }
                        />

                        <div className="space-y-2">
                          {(selectedBuild.parts || []).map((p) => (
                            <div
                              key={p.id}
                              className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 sm:grid-cols-12"
                            >
                              <div className="sm:col-span-3">
                                <TextInput
                                  label="Part"
                                  value={p.name}
                                  onChange={(v) => updatePart(selectedBuild.id, p.id, { name: v })}
                                  placeholder="GPU"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Select
                                  label="Status"
                                  value={p.status}
                                  onChange={(v) => updatePart(selectedBuild.id, p.id, { status: v })}
                                  options={[PART_STATUS.BOUGHT, PART_STATUS.NEEDED, PART_STATUS.NA]}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <TextInput
                                  label="Cost ($)"
                                  type="number"
                                  value={p.cost}
                                  onChange={(v) => updatePart(selectedBuild.id, p.id, { cost: v })}
                                  placeholder="0"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <TextInput
                                  label="Source"
                                  value={p.source}
                                  onChange={(v) => updatePart(selectedBuild.id, p.id, { source: v })}
                                  placeholder="FBM / eBay / MicroCenter"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <TextInput
                                  label="Notes"
                                  value={p.notes}
                                  onChange={(v) => updatePart(selectedBuild.id, p.id, { notes: v })}
                                  placeholder="Model, condition, etc"
                                />
                              </div>

                              <div className="sm:col-span-1 flex items-end justify-end">
                                <Button variant="ghost" onClick={() => deletePart(selectedBuild.id, p.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Card className="p-4">
                        <SectionTitle
                          icon={DollarSign}
                          title="Sale & Profit"
                          subtitle="Track what you sold it for"
                        />

                        {(() => {
                          const t = computeBuildTotals(selectedBuild);
                          const margin = t.expenses > 0 ? (t.profit / t.expenses) * 100 : 0;

                          return (
                            <>
                              <div className="grid grid-cols-1 gap-3">
                                <TextInput
                                  label="Sold For ($)"
                                  type="number"
                                  value={selectedBuild.soldFor}
                                  onChange={(v) => updateBuild(selectedBuild.id, { soldFor: v })}
                                  placeholder="0"
                                />
                                <TextInput
                                  label="Sold Date"
                                  type="date"
                                  value={selectedBuild.soldAt || ""}
                                  onChange={(v) => updateBuild(selectedBuild.id, { soldAt: v })}
                                />
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                                  <div className="text-sm text-zinc-700">Total Expenses</div>
                                  <div className="text-sm font-semibold">{money(t.expenses)}</div>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                                  <div className="text-sm text-zinc-700">Revenue</div>
                                  <div className="text-sm font-semibold">{money(t.soldFor)}</div>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-zinc-200">
                                  <div className="text-sm text-zinc-700">Profit / Loss</div>
                                  <div className="text-sm font-semibold">
                                    <ProfitBadge profit={t.profit} />
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200">
                                  <div className="text-xs text-zinc-500">Profit Margin</div>
                                  <div className="text-lg font-semibold">
                                    {t.expenses > 0 ? `${margin.toFixed(1)}%` : "—"}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-dashed border-zinc-300 p-3 text-xs text-zinc-600">
                                  If you want accurate profit, add shipping/tax as expenses.
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </Card>

                      <Card className="p-4">
                        <SectionTitle icon={Save} title="Quick Actions" subtitle="Backup / Export" />

                        <div className="flex flex-col gap-2">
                          <Button variant="subtle" onClick={exportJSON}>
                            <Download className="h-4 w-4" /> Export Data (JSON)
                          </Button>

                          <label className="cursor-pointer">
                            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200">
                              <Upload className="h-4 w-4" /> Import Data (JSON)
                            </div>
                            <input
                              type="file"
                              accept="application/json"
                              className="hidden"
                              onChange={(e) => importJSON(e.target.files?.[0] || null)}
                            />
                          </label>

                          <Button
                            variant="danger"
                            onClick={() => {
                              if (confirm("Reset ALL data? This clears everything.")) {
                                localStorage.removeItem(LS_KEY);
                                window.location.reload();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Reset All Data
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : null}

          {view === "analytics" ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4">
                <SectionTitle
                  icon={TrendingUp}
                  title="Profit / Loss Dashboard"
                  subtitle="All builds combined"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                    <div className="text-xs text-zinc-500">Total Spent</div>
                    <div className="mt-1 text-xl font-semibold">{money(analytics.totalSpent)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                    <div className="text-xs text-zinc-500">Total Revenue</div>
                    <div className="mt-1 text-xl font-semibold">{money(analytics.totalRevenue)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                    <div className="text-xs text-zinc-500">Total Profit</div>
                    <div className="mt-1 text-xl font-semibold">{money(analytics.totalProfit)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white">
                  <div className="flex items-center justify-between border-b border-zinc-200 p-3">
                    <div className="text-sm font-semibold">Build Breakdown</div>
                    <div className="text-xs text-zinc-500">Click a build in Builds tab to edit</div>
                  </div>

                  <div className="divide-y divide-zinc-200">
                    {data.builds
                      .slice()
                      .sort((a, b) => computeBuildTotals(b).profit - computeBuildTotals(a).profit)
                      .map((b) => {
                        const t = computeBuildTotals(b);
                        return (
                          <div key={b.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-medium">{b.name}</div>
                              <div className="text-xs text-zinc-500">
                                Spent {money(t.expenses)} • Sold {money(t.soldFor)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProfitBadge profit={t.profit} />
                              <Button
                                variant="subtle"
                                onClick={() => {
                                  setSelectedId(b.id);
                                  setView("details");
                                }}
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}

          {view === "settings" ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Card className="p-4">
                <SectionTitle icon={Settings} title="Settings" subtitle="Customize your tracker" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="text-sm font-semibold">Logo</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Upload your logo and it will appear in the top-right corner.
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      {data.logoDataUrl ? (
                        <img src={data.logoDataUrl} alt="Logo" className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-zinc-200" />
                      )}

                      <label className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                          <Upload className="h-4 w-4" /> Upload Logo
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                        />
                      </label>

                      <Button
                        variant="subtle"
                        onClick={() => setData((prev) => ({ ...prev, logoDataUrl: "" }))}
                        disabled={!data.logoDataUrl}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="text-sm font-semibold">Data Backup</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Export/import your tracker so you never lose your builds.
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <Button variant="subtle" onClick={exportJSON}>
                        <Download className="h-4 w-4" /> Export Data (JSON)
                      </Button>

                      <label className="cursor-pointer">
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200">
                          <Upload className="h-4 w-4" /> Import Data (JSON)
                        </div>
                        <input
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={(e) => importJSON(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-700">
                  <div className="font-semibold">How it saves</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    This app saves everything to your browser using localStorage. If you clear your browser data,
                    your builds will be erased unless you exported a backup.
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Built for PC flipping • Local-only app • No data leaves your device
        </div>
      </div>
    </div>
  );
}

export default App;
