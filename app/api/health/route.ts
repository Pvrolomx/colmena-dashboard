import { NextResponse } from "next/server";

interface Project {
  name: string;
  primaryDomain: string;
  allDomains: string[];
  repo: string;
  category: "duendes" | "castle" | "expat" | "client" | "test";
  status: "live" | "down" | "unknown";
  updatedAt: string;
}

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || "";
const TEAM_ID = process.env.VERCEL_TEAM_ID || "";

function categorize(aliases: string[]): "duendes" | "castle" | "expat" | "client" | "test" {
  if (aliases.some((a) => a.includes("duendes.app"))) return "duendes";
  if (aliases.some((a) => a.includes("castlesolutions"))) return "castle";
  if (aliases.some((a) => a.includes("expatadvisor"))) return "expat";
  if (aliases.some((a) => a.includes("psicmarielapm"))) return "client";
  return "test";
}

function pickPrimary(aliases: string[]): string {
  const custom = aliases.find(
    (a) =>
      !a.includes("vercel.app") &&
      !a.startsWith("www.")
  );
  if (custom) return custom;
  const vercel = aliases.find((a) => a.endsWith(".vercel.app") && !a.includes("-git-") && !a.includes("pvrolomxs") && !a.includes("pvrolo-4909"));
  return vercel || aliases[0] || "";
}

async function checkHealth(domain: string): Promise<"live" | "down"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    return res.ok || res.status === 308 || res.status === 307 ? "live" : "down";
  } catch {
    return "down";
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects?teamId=${TEAM_ID}&limit=50`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }, next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Vercel API error" }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.projects || [];

    const projects: Project[] = raw.map((p: any) => {
      const targets = p.targets || {};
      const prod = targets.production || {};
      const aliases: string[] = prod.alias || [];
      const primary = pickPrimary(aliases);
      const cat = categorize(aliases);
      return {
        name: p.name,
        primaryDomain: primary,
        allDomains: aliases,
        repo: p.link?.repo || "",
        category: cat,
        status: "unknown" as const,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
      };
    });

    // Health checks in parallel (batch of 10)
    const batchSize = 10;
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((p) => (p.primaryDomain ? checkHealth(p.primaryDomain) : Promise.resolve("down" as const)))
      );
      results.forEach((status, j) => {
        projects[i + j].status = status;
      });
    }

    // Sort: duendes first, then castle, expat, client, test. Within each, live first.
    const catOrder = { duendes: 0, castle: 1, expat: 2, client: 3, test: 4 };
    projects.sort((a, b) => {
      const ca = catOrder[a.category] - catOrder[b.category];
      if (ca !== 0) return ca;
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return a.name.localeCompare(b.name);
    });

    const summary = {
      total: projects.length,
      live: projects.filter((p) => p.status === "live").length,
      down: projects.filter((p) => p.status === "down").length,
      duendes: projects.filter((p) => p.category === "duendes").length,
      test: projects.filter((p) => p.category === "test").length,
    };

    return NextResponse.json({ projects, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
