import type { Request, Response } from "express";
import { Resource } from "../models/resource.model";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listPublicResources(req: Request, res: Response) {
  try {
    const {
      q = "",
      type = "all",
      page = "1",
      limit = "12",
      sort = "new",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const rawLimit = Math.max(1, Number.parseInt(limit, 10) || 12);
    const pageSize = Math.min(rawLimit, 100);

    const filter: Record<string, unknown> = {};

    if (type && type !== "all") {
      filter.type = type;
    }

    if (q && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const sortSpec =
      sort === "old"
        ? ({ created_at: 1 } as const)
        : ({ created_at: -1 } as const);

    const [items, total] = await Promise.all([
      Resource.find(filter)
        .sort(sortSpec)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Resource.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to list resources" });
  }
}

/**
 * GET /api/resources/:id
 */
export async function getPublicResource(req: Request, res: Response) {
  try {
    const doc = await Resource.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ resource: doc });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to get resource" });
  }
}
