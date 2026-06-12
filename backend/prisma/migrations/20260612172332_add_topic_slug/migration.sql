-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- RemoveDefaultOnly
ALTER TABLE "Topic" ALTER COLUMN "slug" DROP DEFAULT;
