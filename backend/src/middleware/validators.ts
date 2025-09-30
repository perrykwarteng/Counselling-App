import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction, RequestHandler } from "express";

const validate = (rules: RequestHandler[]) => [
  ...rules,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];

// export const registerRules = validate([
//   body("role").isIn(["student", "counselor", "admin"]),
//   body("full_name").isString().notEmpty(),
//   body("email").isEmail(),
//   body("password").isStrongPassword({ minLength: 6, minSymbols: 0 }),
// ]);

// export const loginRules = validate([
//   body("email").isEmail(),
//   body("password").isString(),
// ]);

export const createApptRules = validate([
  body("counselor_id").isString(),
  body("scheduled_at").isISO8601(),
  body("mode").isIn(["chat", "video", "in-person"]),
]);

export const updateApptStatusRules = validate([
  param("id").isString(),
  body("status").isIn(["accepted", "rejected", "cancelled", "completed"]),
]);

export const sendMessageRules = validate([
  param("appointmentId").isString(),
  body("content").isString().notEmpty(),
]);

export const feedbackRules = validate([
  body("appointment_id").isString(),
  body("rating").isInt({ min: 1, max: 5 }),
]);
