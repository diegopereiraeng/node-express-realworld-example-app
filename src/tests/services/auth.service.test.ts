import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Default Prisma instance (used in production)
const defaultPrisma = new PrismaClient();

// Helper to validate fields
const validateUserFields = (user: any) => {
  const errors: any = {};

  if (!user.username || user.username.trim() === '') {
    errors.username = ["can't be blank"];
  }
  if (!user.email || user.email.trim() === '') {
    errors.email = ["can't be blank"];
  }
  if (!user.password || user.password.trim() === '') {
    errors.password = ["can't be blank"];
  }

  if (Object.keys(errors).length > 0) {
    throw new Error(JSON.stringify({ errors }));
  }
};

// Generate token
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );
};

// Create User
export const createUser = async (user: any, prisma = defaultPrisma) => {
  validateUserFields(user);

  const existing = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existing) {
    throw new Error(JSON.stringify({ email: ['has already been taken'] }));
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);
  const createdUser = await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      password: hashedPassword,
      image: user.image || null,
      demo: user.demo ?? false,
    },
  });

  return {
    ...createdUser,
    token: generateToken(createdUser),
  };
};

// Login User
export const login = async (user: any, prisma = defaultPrisma) => {
  validateUserFields(user);

  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!existingUser) {
    throw new Error(JSON.stringify({ 'email or password': ['is invalid'] }));
  }

  const isPasswordValid = await bcrypt.compare(user.password, existingUser.password);

  if (!isPasswordValid) {
    throw new Error(JSON.stringify({ 'email or password': ['is invalid'] }));
  }

  return {
    ...existingUser,
    token: generateToken(existingUser),
  };
};

// Get Current User
export const getCurrentUser = async (id: number, prisma = defaultPrisma) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    ...user,
    token: generateToken(user),
  };
};

// Update User
export const updateUser = async (userData: any, userId: number, prisma = defaultPrisma) => {
  let dataToUpdate = { ...userData };

  if (userData.password) {
    dataToUpdate.password = await bcrypt.hash(userData.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  return {
    ...user,
    token: generateToken(user),
  };
};
