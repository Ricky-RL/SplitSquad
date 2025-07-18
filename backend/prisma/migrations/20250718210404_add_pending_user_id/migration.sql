/*
  Warnings:

  - A unique constraint covering the columns `[pendingUserId]` on the table `GroupPendingMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GroupPendingMember" ADD COLUMN     "pendingUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GroupPendingMember_pendingUserId_key" ON "GroupPendingMember"("pendingUserId");
