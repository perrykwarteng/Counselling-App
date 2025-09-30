import type { Request, Response } from "express";
import { Resource } from "../models/resource.model";

export async function listResources(_req: Request, res: Response) {
  try {
    const items = await Resource.find({}).sort({ created_at: -1 }).lean();
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to list resources" });
  }
}

export async function getResource(req: Request, res: Response) {
  try {
    const item = await Resource.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ resource: item });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to get resource" });
  }
}

export async function createResource(req: Request, res: Response) {
  try {
    const { title, description, file_url, type } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const doc = await Resource.create({
      title: String(title).trim(),
      description: (description ?? null) || null,
      file_url: (file_url ?? null) || null,
      type: (type as any) ?? "other",
      uploaded_by: (req as any).user?._id ?? null,
    });

    res.status(201).json({ resource: doc.toObject() });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to create resource" });
  }
}

export async function updateResource(req: Request, res: Response) {
  try {
    const { title, description, file_url, type } = req.body;
    const update: Record<string, unknown> = {};

    if (typeof title !== "undefined") update.title = title;
    if (typeof description !== "undefined")
      update.description = description ?? null;
    if (typeof file_url !== "undefined") update.file_url = file_url ?? null;
    if (typeof type !== "undefined") update.type = type;

    const doc = await Resource.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).lean();

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ resource: doc });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to update resource" });
  }
}

export async function deleteResource(req: Request, res: Response) {
  try {
    const doc = await Resource.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to delete resource" });
  }
}

export async function uploadResourceFile(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

   
    const file_url = `/uploads/${req.file.filename}`;
    res.status(201).json({ file_url });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to upload file" });
  }
}
