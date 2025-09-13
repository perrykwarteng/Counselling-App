import { NextFunction, Response } from 'express';
import { AuthedRequest } from './requireAuth';
export function roleGuard(...allowed: Array<'student' | 'counselor' | 'admin'>) {
return (req: AuthedRequest, res: Response, next: NextFunction) => {
const role = req.user?.role;
if (!role || !allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
next();
};
}