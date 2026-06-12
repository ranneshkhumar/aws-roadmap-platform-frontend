const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pkg = require('pg');

const pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const topics = await prisma.topic.findMany();
  console.log('TOPICS:', JSON.stringify(topics, null, 2));

  const modules = await prisma.module.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      topicId: true,
      level: true,
      orderIndex: true,
      tier: true,
    },
  });
  console.log('MODULES:', JSON.stringify(modules, null, 2));

  const slideCounts = await prisma.learningSlide.groupBy({
    by: ['moduleId'],
    _count: { id: true },
  });
  console.log('SLIDE COUNTS:', JSON.stringify(slideCounts, null, 2));

  const questionCounts = await prisma.quizQuestion.groupBy({
    by: ['moduleId'],
    _count: { id: true },
  });
  console.log('QUESTION COUNTS:', JSON.stringify(questionCounts, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
