/*
  Warnings:

  - A unique constraint covering the columns `[groupId,email]` on the table `GroupPendingMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GroupPendingMember_groupId_email_key" ON "GroupPendingMember"("groupId", "email");
