import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || "MTk4ZThhYmMxMjM0NTY3ODlhYmNkZWYwMTIzNDU2NzhhYmNkZWYwMTIzNDU2NzhhYmNkZWYwMTIzNDU2Nzg=";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "86400000";

export const register = async (req, res) => {
  const { username, email, password, role, name, phone } = req.body;

  try {
    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Error: Username is already taken!" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Error: Email is already in use!" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'STUDENT',
        name,
        phone
      }
    });

    return res.status(200).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Internal server error during registration." });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ message: "Error: Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Error: Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: parseInt(JWT_EXPIRATION) / 1000 } // convert ms to seconds
    );

    return res.status(200).json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error during login." });
  }
};
