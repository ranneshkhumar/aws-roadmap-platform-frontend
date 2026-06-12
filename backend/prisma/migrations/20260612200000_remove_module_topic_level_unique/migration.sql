-- DropIndex
DROP INDEX "Module_topicId_level_key";

-- CreateIndex
CREATE INDEX "Module_topicId_level_idx" ON "Module"("topicId", "level");
