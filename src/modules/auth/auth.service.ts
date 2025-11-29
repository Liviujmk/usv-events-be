import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '../../db';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../../utils/jwt';
import { log } from '../../middleware/logger';
import type { RegisterInput, LoginInput } from './auth.schema';
import type { AuthUser } from '../../types';

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        facultyId: input.facultyId,
        phone: input.phone,
        role: 'student',
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      });

    log.info(`User registered: ${newUser.email}`);

    // Generate tokens
    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    };

    const accessToken = await generateAccessToken(authUser);
    const refreshToken = await generateRefreshToken(newUser.id);

    // Save refresh token
    await db.insert(refreshTokens).values({
      userId: newUser.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login a user
   */
  async login(input: LoginInput) {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    log.info(`User logged in: ${user.email}`);

    // Generate tokens
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = await generateAccessToken(authUser);
    const refreshToken = await generateRefreshToken(user.id);

    // Save refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token exists in database
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken))
      .limit(1);

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
      throw new Error('Refresh token expired');
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = await generateAccessToken(authUser);

    // Generate new refresh token and replace old one
    const newRefreshToken = await generateRefreshToken(user.id);

    await db
      .update(refreshTokens)
      .set({
        token: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      })
      .where(eq(refreshTokens.id, storedToken.id));

    return {
      user: authUser,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user - invalidate refresh token
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific refresh token
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    } else {
      // Delete all refresh tokens for user
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    }

    log.info(`User logged out: ${userId}`);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Invalidate all refresh tokens
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

    log.info(`Password changed for user: ${userId}`);
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        facultyId: users.facultyId,
        profileImage: users.profileImage,
        phone: users.phone,
        bio: users.bio,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();

