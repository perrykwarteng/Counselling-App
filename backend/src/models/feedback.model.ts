import { Schema, model, Types, Document } from "mongoose";

export interface FeedbackModel extends Document {
  appointment_id: Types.ObjectId;
  student_id: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<FeedbackModel>(
  {
    appointment_id: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const FeedbackModel = model<FeedbackModel>("Feedback", FeedbackSchema);
