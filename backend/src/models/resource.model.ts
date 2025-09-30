import mongoose, { Schema, Types } from "mongoose";

export interface IResource {
  title: string;
  description?: string | null;
  file_url?: string | null;
  type?: "video" | "article" | "pdf" | "other";
  uploaded_by?: Types.ObjectId | null; // ref to users._id
  created_at: Date;
  updated_at?: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    file_url: { type: String, default: null },
    type: {
      type: String,
      enum: ["video", "article", "pdf", "other"],
      default: "other",
    },
    uploaded_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Resource =
  mongoose.models.Resource ||
  mongoose.model<IResource>("Resource", ResourceSchema);
