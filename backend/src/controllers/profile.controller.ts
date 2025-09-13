import { Response } from "express";
import { User } from "../models/user.model";
import { AuthedRequest } from "../middleware/requireAuth";
import { isNonEmptyString, isEmail } from "../utils/validate";

export const getStudentProfile = async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user!.sub).select("-password_hash");
  return res.json(user);
};

export const updateStudentProfile = async (
  req: AuthedRequest,
  res: Response
) => {
  const { name, phone, is_anonymous, avatar_url } = req.body;
  if (name !== undefined && !isNonEmptyString(name))
    return res.status(400).json({ error: "Invalid name" });
  const user = await User.findByIdAndUpdate(
    req.user!.sub,
    { $set: { name, phone, is_anonymous, avatar_url } },
    { new: true }
  ).select("-password_hash");
  return res.json(user);
};

export const getCounselorProfile = async (
  req: AuthedRequest,
  res: Response
) => {
  const user = await User.findById(req.user!.sub).select("-password_hash");
  return res.json(user);
};

export const updateCounselorProfile = async (
  req: AuthedRequest,
  res: Response
) => {
  const { name, phone, is_anonymous, avatar_url } = req.body;
  if (name !== undefined && !isNonEmptyString(name))
    return res.status(400).json({ error: "Invalid name" });
  const user = await User.findByIdAndUpdate(
    req.user!.sub,
    { $set: { name, phone, is_anonymous, avatar_url } },
    { new: true }
  ).select("-password_hash");
  return res.json(user);
};
