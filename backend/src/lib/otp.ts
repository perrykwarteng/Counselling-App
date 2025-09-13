import bcrypt from "bcryptjs";
export function generateNumericOTP(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}
export async function hashOTP(code: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
}
export async function matchOTP(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
