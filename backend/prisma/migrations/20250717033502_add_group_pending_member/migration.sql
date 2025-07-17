-- CreateTable
CREATE TABLE "GroupPendingMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPendingMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupPendingMember" ADD CONSTRAINT "GroupPendingMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
