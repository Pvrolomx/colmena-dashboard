"use client";

import { useEffect, useState, useCallback } from "react";

interface Project {
  name: string;
  primaryDomain: string;
  allDomains: string[];
  repo: string;
  category: "duendes" | "castle" | "expat" | "client" | "test";
  status: "live" | "down" | "unknown";
  updatedAt: string;
}

interface Summary {
  total: number;
  live: number;
  down: number;
  duendes: number;
  test: number;
}

const CAT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  duendes: { label: "Duendes.app", color: "#f59e0b", emoji: "🐝" },
  castle: { label: "Castle Solutions", color: "#3b82f6", emoji: "🏰" },
  expat: { label: "Expat Advisor", color: "#10b981", emoji: "🌎" },
  client: { label: "Clientes", color: "#8b5cf6", emoji: "👤" },
  test: { label: "Test / Legacy", color: "#6b7280", emoji: "🧪" },
};

function StatusDot({ status }: { status: string }) {
  const color = status === "live" ? "#22c55e" : status === "down" ? "#ef4444" : "#6b7280";
  return (
    <span
      className={status === "live" ? "pulse-dot" : ""}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: color,
        marginRight: 8,
        boxShadow: status === "live" ? `0 0 6px ${color}` : "none",
      }}
    />
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #222",
        borderRadius: 12,
        padding: "16px 20px",
        minWidth: 120,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function AppCard({ project, flagged, onFlag }: { project: Project; flagged: boolean; onFlag: () => void }) {
  const cat = CAT_LABELS[project.category];
  return (
    <div
      style={{
        background: flagged ? "#1a1010" : "#141414",
        border: `1px solid ${flagged ? "#7f1d1d" : "#222"}`,
        borderRadius: 12,
        padding: 16,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {flagged && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#7f1d1d",
            color: "#fca5a5",
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 6,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          🗑 Cleanup
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <StatusDot status={project.status} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>{project.name}</span>
      </div>

      <a
        href={`https://${project.primaryDomain}`}
        target="_blank"
        rel="noopener"
        style={{ fontSize: 13, color: cat.color, textDecoration: "none", display: "block", marginBottom: 8 }}
      >
        {project.primaryDomain}
      </a>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {project.repo && (
            <a
              href={`https://github.com/Pvrolomx/${project.repo}`}
              target="_blank"
              rel="noopener"
              style={{
                fontSize: 11,
                color: "#888",
                textDecoration: "none",
                background: "#1a1a1a",
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid #333",
              }}
            >
              ⌥ {project.repo}
            </a>
          )}
          <span
            style={{
              fontSize: 11,
              color: "#888",
              background: "#1a1a1a",
              padding: "2px 8px",
              borderRadius: 6,
              border: "1px solid #333",
            }}
          >
            {cat.emoji} {cat.label}
          </span>
        </div>

        <button
          onClick={onFlag}
          style={{
            fontSize: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            opacity: flagged ? 1 : 0.3,
            transition: "opacity 0.2s",
            padding: 4,
          }}
          title={flagged ? "Quitar marca" : "Marcar para limpieza"}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProjects(data.projects);
      setSummary(data.summary);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFlag = (name: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filtered = filter === "all" ? projects : filter === "flagged" ? projects.filter((p) => flagged.has(p.name)) : projects.filter((p) => p.category === filter);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            🐝 Colmena Dashboard
          </h1>
          <p style={{ color: "#666", fontSize: 13, margin: "4px 0 0" }}>
            Panel central — status de todas las apps
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#e5e5e5",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: loading ? "wait" : "pointer",
              fontSize: 13,
            }}
          >
            {loading ? "⏳ Escaneando..." : "🔄 Refresh"}
          </button>
          {lastRefresh && (
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
              {lastRefresh.toLocaleTimeString("es-MX")}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#1a0a0a", border: "1px solid #7f1d1d", padding: 16, borderRadius: 12, marginBottom: 16, color: "#fca5a5" }}>
          Error: {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total" value={summary.total} color="#e5e5e5" />
          <StatCard label="Live" value={summary.live} color="#22c55e" />
          <StatCard label="Down" value={summary.down} color="#ef4444" />
          <StatCard label="Duendes" value={summary.duendes} color="#f59e0b" />
          <StatCard label="Test" value={summary.test} color="#6b7280" />
          {flagged.size > 0 && <StatCard label="🗑 Cleanup" value={flagged.size} color="#f87171" />}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Todas" },
          { key: "duendes", label: "🐝 Duendes" },
          { key: "castle", label: "🏰 Castle" },
          { key: "expat", label: "🌎 Expat" },
          { key: "client", label: "👤 Clientes" },
          { key: "test", label: "🧪 Test" },
          ...(flagged.size > 0 ? [{ key: "flagged", label: "🗑 Cleanup" }] : []),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? "#f59e0b" : "#1a1a1a",
              color: filter === f.key ? "#000" : "#999",
              border: `1px solid ${filter === f.key ? "#f59e0b" : "#333"}`,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: filter === f.key ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading && projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🐝</div>
          Escaneando la colmena...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <AppCard key={p.name} project={p} flagged={flagged.has(p.name)} onFlag={() => toggleFlag(p.name)} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "40px 0 20px", color: "#444", fontSize: 12 }}>
        Hecho por duendes.app 2026 — CD21
      </div>
    </div>
  );
}
