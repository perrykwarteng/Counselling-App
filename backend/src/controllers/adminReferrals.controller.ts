// src/controllers/adminReferrals.controller.ts
import { Request, Response } from "express";
import type { PipelineStage } from "mongoose";
import { Referral } from "../models/referral.model";
import { User } from "../models/user.model";

/**
 * GET /admin-referrals/students
 * Latest referral per student + joined student/counselor user docs
 */
export async function listReferredStudents(req: Request, res: Response) {
  try {
    const pipeline: PipelineStage[] = [
      { $sort: { student_id: 1, created_at: -1 } },
      { $group: { _id: "$student_id", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },

      // Student (type-safe join)
      {
        $lookup: {
          from: "users",
          let: { sid: "$student_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$sid" }] },
              },
            },
          ],
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },

      // Counselor (type-safe join)
      {
        $lookup: {
          from: "users",
          let: { cid: "$counselor_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$cid" }] },
              },
            },
          ],
          as: "counselor",
        },
      },
      { $unwind: { path: "$counselor", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          referred_by: 1,
          reason: 1,
          created_at: 1,
          student: {
            _id: "$student._id",
            name: "$student.name",
            email: "$student.email",
            phone: "$student.phone",
            role: "$student.role",
            is_active: "$student.is_active",
            is_verified: "$student.is_verified",
            is_anonymous: "$student.is_anonymous",
            created_at: "$student.created_at",
            profile: "$student.profile",
          },
          counselor: {
            _id: "$counselor._id",
            name: "$counselor.name",
            email: "$counselor.email",
            role: "$counselor.role",
            counselor_type: "$counselor.counselor_type",
            specialities: "$counselor.specialities",
          },
        },
      },
      { $sort: { created_at: -1 } },
    ];

    const items = await Referral.aggregate(pipeline);
    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ ok: false, error: "Failed to load referred students" });
  }
}

/**
 * GET /admin-referrals/counselors
 * Latest assignment per student → count per counselor
 */
export async function listReferredCounselors(req: Request, res: Response) {
  try {
    const pipeline: PipelineStage[] = [
      { $sort: { student_id: 1, created_at: -1 } },
      { $group: { _id: "$student_id", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },
      { $group: { _id: "$counselor_id", total_assigned: { $sum: 1 } } },

      // Counselor (type-safe join)
      {
        $lookup: {
          from: "users",
          let: { cid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$cid" }] },
              },
            },
          ],
          as: "counselor",
        },
      },
      { $unwind: { path: "$counselor", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          total_assigned: 1,
          counselor: {
            _id: "$counselor._id",
            name: "$counselor.name",
            email: "$counselor.email",
            role: "$counselor.role",
            counselor_type: "$counselor.counselor_type",
            specialities: "$counselor.specialities",
          },
        },
      },
      { $sort: { "counselor.name": 1 } },
    ];

    const items = await Referral.aggregate(pipeline);
    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load counselors" });
  }
}

/**
 * GET /admin-referrals/unassigned-students
 * Students with no referral record
 */
export async function listUnassignedStudents(req: Request, res: Response) {
  try {
    const referredIds = (await Referral.distinct("student_id")) as string[];

    const items = await User.find(
      { role: "student", _id: { $nin: referredIds } },
      {
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        is_active: 1,
        is_verified: 1,
        is_anonymous: 1,
        created_at: 1,
        profile: 1,
      }
    )
      .sort({ created_at: -1 })
      .lean();

    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ ok: false, error: "Failed to load unassigned students" });
  }
}

/**
 * POST /admin-referrals/refer-student
 * body: { student_id, counselor_id, reason? }
 */
export async function createReferral(req: Request, res: Response) {
  try {
    const referred_by = (req as any).user?.id as string; // from your auth layer
    const { student_id, counselor_id, reason } = req.body || {};

    if (!student_id || !counselor_id) {
      return res
        .status(400)
        .json({ ok: false, error: "student_id and counselor_id are required" });
    }

    const [student, counselor] = await Promise.all([
      User.findOne({ _id: student_id, role: "student" }).select({ _id: 1 }),
      User.findOne({ _id: counselor_id, role: "counselor" }).select({ _id: 1 }),
    ]);

    if (!student)
      return res.status(404).json({ ok: false, error: "Student not found" });
    if (!counselor)
      return res.status(404).json({ ok: false, error: "Counselor not found" });

    const created = await Referral.create({
      student_id,
      counselor_id,
      referred_by,
      reason: reason || null,
      created_at: new Date(),
    });

    res.status(201).json({ ok: true, item: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to create referral" });
  }
}

/**
 * GET /admin-referrals/referral-history/:studentId
 * Full history with counselor + referrer info
 */
export async function getReferralHistoryByStudent(req: Request, res: Response) {
  try {
    const studentId = req.params.studentId;

    const pipeline: PipelineStage[] = [
      // match with type-robust comparison
      { $match: { $expr: { $eq: [{ $toString: "$student_id" }, studentId] } } },
      { $sort: { created_at: -1 } },

      // counselor (type-safe join)
      {
        $lookup: {
          from: "users",
          let: { cid: "$counselor_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$cid" }] },
              },
            },
          ],
          as: "counselor",
        },
      },
      { $unwind: { path: "$counselor", preserveNullAndEmptyArrays: true } },

      // referrer (type-safe join)
      {
        $lookup: {
          from: "users",
          let: { rid: "$referred_by" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$rid" }] },
              },
            },
          ],
          as: "referrer",
        },
      },
      { $unwind: { path: "$referrer", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          student_id: 1,
          counselor_id: 1,
          referred_by: 1,
          reason: 1,
          created_at: 1,
          counselor: {
            _id: "$counselor._id",
            name: "$counselor.name",
            email: "$counselor.email",
            role: "$counselor.role",
          },
          referred_by_user: {
            _id: "$referrer._id",
            name: "$referrer.name",
            email: "$referrer.email",
            role: "$referrer.role",
          },
        },
      },
    ];

    const items = await Referral.aggregate(pipeline);
    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch referral history" });
  }
}
