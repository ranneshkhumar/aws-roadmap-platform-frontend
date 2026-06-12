-- CreateEnum
CREATE TYPE "ModuleLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_orderIndex_key" ON "Topic"("orderIndex");

-- AlterTable
ALTER TABLE "Module" ADD COLUMN "topicId" TEXT,
ADD COLUMN "level" "ModuleLevel";

-- CreateIndex
CREATE UNIQUE INDEX "Module_topicId_level_key" ON "Module"("topicId", "level");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
