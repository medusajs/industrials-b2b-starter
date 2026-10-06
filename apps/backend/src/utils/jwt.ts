import jwt from "jsonwebtoken";

export function generateJwtToken(
  payload: Record<string, any>,
  secret: string,
  expiresIn: string = "7d"
): string {
  return jwt.sign(payload, secret as jwt.Secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyJwtToken<T = Record<string, any>>(
  token: string,
  secret: string
): T {
  return jwt.verify(token, secret) as T;
}

export interface EmployeeInvitePayload {
  email: string;
  company_id: string;
  spending_limit: number | null;
  is_admin: boolean;
  type: "employee_invite";
}
