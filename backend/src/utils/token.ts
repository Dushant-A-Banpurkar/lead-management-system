import jwt from "jsonwebtoken";
import { config } from "../config/env";

export function issueToken(userId: string) {
  return jwt.sign({}, config.JWT_SECRET, {
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}
