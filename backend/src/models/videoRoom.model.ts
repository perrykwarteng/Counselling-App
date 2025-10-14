import { Schema, model } from "mongoose";

const videoRoomSchema = new Schema(
  {
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    session_token_hash: { type: String, default: null },
    active: { type: Boolean, default: true },
    expires_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VideoRoomModel = model("VideoRoom", videoRoomSchema);
