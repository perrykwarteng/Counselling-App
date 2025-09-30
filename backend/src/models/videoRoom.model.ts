import { Schema, model } from "mongoose";

const videoRoomSchema = new Schema(
  {
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true }, // student or counselor
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }], // who can join
    session_token: { type: String, required: true }, // like in VideoSession
    active: { type: Boolean, default: true }, // whether the call is ongoing
  },
  { timestamps: true }
);

export const VideoRoomModel = model("VideoRoom", videoRoomSchema);
