import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import type { UpdateUserInput } from '../validators/user.validator';

/** Shape returned to the owner (self). Excludes nothing sensitive beyond internals. */
export interface UserDto {
  id: string;
  githubLogin: string;
  handle: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  publicProfileEnabled: boolean;
  createdAt: string;
}

function toDto(u: {
  id: string;
  githubLogin: string;
  handle: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  publicProfileEnabled: boolean;
  createdAt: Date;
}): UserDto {
  return {
    id: u.id,
    githubLogin: u.githubLogin,
    handle: u.handle,
    displayName: u.displayName,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    plan: u.plan,
    publicProfileEnabled: u.publicProfileEnabled,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new NotFoundError('User not found');
  return toDto(user);
}

export async function updateMe(userId: string, input: UpdateUserInput): Promise<UserDto> {
  if (input.handle) {
    const taken = await prisma.user.findFirst({
      where: { handle: input.handle, id: { not: userId } },
    });
    if (taken) throw new ConflictError('Handle already taken');
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { displayName: input.displayName, handle: input.handle },
  });
  return toDto(user);
}

/** Soft-delete the account and immediately revoke all sessions (GDPR-aligned). */
export async function deleteMe(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }),
    prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
