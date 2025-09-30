import { Request, Response } from "express";
import type { PipelineStage } from "mongoose";
import { AdminLog, IAdminLog, LogLevel } from "../models/adminLog.model";

function parseDate(d?: string) {
  if (!d) return undefined;
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t) : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeRegexInput(q: string) {
  return q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildListPipeline(opts: {
  level?: string;
  module?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}): { pipeline: PipelineStage[]; page: number; limit: number } {
  const { level, module, q = "", from, to, page = "1", limit = "10" } = opts;

  const p = clamp(parseInt(page as any, 10) || 1, 1, 10_000);
  const l = clamp(parseInt(limit as any, 10) || 10, 1, 200);

  const match: Record<string, any> = {};
  if (level && ["info", "warn", "error", "audit"].includes(level)) {
    match.level = level as LogLevel;
  }
  if (module) match.module = module;

  const fromD = parseDate(from);
  const toD = parseDate(to);
  if (fromD || toD) {
    match.timestamp = {};
    if (fromD) match.timestamp.$gte = fromD;
    if (toD) match.timestamp.$lte = toD;
  }

  const pipeline: PipelineStage[] = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const qq = (q || "").trim();
  if (qq) {
    const safe = sanitizeRegexInput(qq);
    pipeline.push({
      $match: {
        $or: [
          { message: { $regex: safe, $options: "i" } },
          { module: { $regex: safe, $options: "i" } },
          { user_id: { $regex: safe, $options: "i" } },
          { request_id: { $regex: safe, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$meta" },
                regex: safe,
                options: "i",
              },
            },
          },
        ],
      },
    });
  }

  pipeline.push({ $sort: { timestamp: -1 } });

  pipeline.push({
    $project: {
      _id: 0,
      id: "$_id",
      timestamp: 1,
      level: 1,
      module: 1,
      message: 1,
      user_id: 1,
      request_id: 1,
      meta: 1,
    },
  });

  pipeline.push({
    $facet: {
      items: [{ $skip: (p - 1) * l }, { $limit: l }],
      total: [{ $count: "count" }],
    },
  });

  return { pipeline, page: p, limit: l };
}

// GET /admin-logs
export async function listAdminLogs(req: Request, res: Response) {
  try {
    const { pipeline, page, limit } = buildListPipeline(req.query as any);
    const agg = await AdminLog.aggregate(pipeline);
    const items = agg[0]?.items ?? [];
    const total = agg[0]?.total?.[0]?.count ?? 0;

    res.json({
      ok: true,
      page,
      limit,
      total,
      items,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load system logs" });
  }
}

// GET /admin-logs/:id
export async function getAdminLogById(req: Request, res: Response) {
  try {
    const doc = await AdminLog.findById(req.params.id).lean();
    if (!doc)
      return res.status(404).json({ ok: false, error: "Log not found" });

    const item = {
      id: doc._id,
      timestamp: doc.timestamp,
      level: doc.level,
      module: doc.module,
      message: doc.message,
      user_id: doc.user_id ?? null,
      request_id: doc.request_id ?? null,
      meta: doc.meta ?? {},
    };

    res.json({ ok: true, item });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to fetch log" });
  }
}

// GET /admin-logs/modules  (distinct module names)
export async function listAdminLogModules(_req: Request, res: Response) {
  try {
    const modules = await AdminLog.distinct("module");
    modules.sort((a: any, b: any) => String(a).localeCompare(String(b)));
    res.json({ ok: true, items: modules });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load modules" });
  }
}

// GET /admin-logs/export?format=csv|json&...(same filters)
export async function exportAdminLogs(req: Request, res: Response) {
  try {
    const format = String(req.query.format || "csv").toLowerCase() as
      | "csv"
      | "json";
    const { pipeline } = buildListPipeline({
      ...req.query,
      page: "1",
      limit: "10000",
    });
    const pipeNoFacet = pipeline.slice(0, -1); // drop last $facet
    const items: any[] = await AdminLog.aggregate(pipeNoFacet);

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="system-logs_${new Date().toISOString()}.json"`
      );
      return res.status(200).send(JSON.stringify(items, null, 2));
    }

    // CSV
    const headers = [
      "id",
      "timestamp",
      "level",
      "module",
      "message",
      "user_id",
      "request_id",
      "meta_json",
    ];

    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      headers.join(","),
      ...items.map((r) =>
        [
          r.id,
          r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
          r.level,
          r.module,
          r.message,
          r.user_id ?? "",
          r.request_id ?? "",
          JSON.stringify(r.meta ?? {}),
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="system-logs_${new Date().toISOString()}.csv"`
    );
    res.status(200).send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to export logs" });
  }
}

export async function writeAdminLog(
  entry: Omit<IAdminLog, "_id" | "timestamp"> & { timestamp?: Date }
) {
  try {
    await AdminLog.create({
      _id: undefined,
      timestamp: entry.timestamp ?? new Date(),
      level: entry.level,
      module: entry.module,
      message: entry.message,
      user_id: entry.user_id ?? null,
      request_id: entry.request_id ?? null,
      meta: entry.meta ?? {},
    });
  } catch (e) {
    console.error("[admin-log] failed to write log:", e);
  }
}
