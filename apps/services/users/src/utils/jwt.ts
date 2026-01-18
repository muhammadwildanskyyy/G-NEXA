import jwt from "jsonwebtoken";
import { SECRET } from "./env";

export const generateToken = (payload: object) => {
  return jwt.sign(payload, SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};
