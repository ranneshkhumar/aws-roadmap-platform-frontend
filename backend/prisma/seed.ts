import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import * as bcrypt from 'bcrypt';
import { TOPIC, CURRICULUM_MODULES } from './curriculum/aws-roadmap';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER_SLUGS = [
  'module-a',
  'module-a-inter',
  'module-a-adv',
  'moduble-b',
  'module-c',
];

async function main() {
  console.log('Seeding database...');

  // ── 1. Seed Demo Users ──────────────────────────────────────────
  const passwordHashCore = await bcrypt.hash('core123', 10);
  const passwordHashCrew = await bcrypt.hash('crew123', 10);
  const passwordHashUser = await bcrypt.hash('user123', 10);

  const demoUsers = [
    { email: 'core@cloudclub.com', name: 'Core Admin', passwordHash: passwordHashCore, role: 'CORE' as const },
    { email: 'crew@cloudclub.com', name: 'Crew Member', passwordHash: passwordHashCrew, role: 'CREW' as const },
    { email: 'enthusiast@cloudclub.com', name: 'Cloud Enthusiast', passwordHash: passwordHashUser, role: 'ENTHUSIAST' as const },
    { email: 'user@cloudclub.com', name: 'Cloud User', passwordHash: passwordHashUser, role: 'ENTHUSIAST' as const },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        passwordHash: u.passwordHash,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: u.passwordHash,
        role: u.role,
        xp: 0,
        streak: 0,
      },
    });
  }
  console.log('Demo users seeded successfully!');

  // ── 2. Delete placeholder modules (and their dependents) ────────
  const placeholders = await prisma.module.findMany({
    where: { slug: { in: PLACEHOLDER_SLUGS } },
    select: { id: true },
  });
  const placeholderIds = placeholders.map((p) => p.id);

  if (placeholderIds.length > 0) {
    console.log(`Deleting ${placeholderIds.length} placeholder modules...`);

    await prisma.quizAttemptAnswer.deleteMany({
      where: { attempt: { moduleId: { in: placeholderIds } } },
    });
    await prisma.quizAttempt.deleteMany({
      where: { moduleId: { in: placeholderIds } },
    });
    await prisma.userModuleProgress.deleteMany({
      where: { moduleId: { in: placeholderIds } },
    });
    await prisma.learningSlide.deleteMany({
      where: { moduleId: { in: placeholderIds } },
    });
    await prisma.quizQuestion.deleteMany({
      where: { moduleId: { in: placeholderIds } },
    });
    await prisma.module.deleteMany({
      where: { slug: { in: PLACEHOLDER_SLUGS } },
    });

    console.log('Placeholder modules deleted.');
  }

  // ── 3. Upsert Topic ─────────────────────────────────────────────
  const topic = await prisma.topic.upsert({
    where: { slug: TOPIC.slug },
    update: {
      name: TOPIC.name,
      description: TOPIC.description,
      orderIndex: TOPIC.orderIndex,
    },
    create: TOPIC,
  });
  console.log(`Topic "${topic.name}" (${topic.slug}) ready, id=${topic.id}`);

  // ── 4. Seed Modules, Slides, and Quiz Questions ─────────────────
  let slideTotal = 0;
  let questionTotal = 0;

  for (const m of CURRICULUM_MODULES) {
    const dbModule = await prisma.module.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        description: m.description,
        tier: m.tier,
        xpPoints: m.xpPoints,
        estimatedMinutes: m.estimatedMinutes,
        orderIndex: m.orderIndex,
        topicId: topic.id,
        level: m.level,
      },
      create: {
        slug: m.slug,
        name: m.name,
        description: m.description,
        tier: m.tier,
        xpPoints: m.xpPoints,
        estimatedMinutes: m.estimatedMinutes,
        orderIndex: m.orderIndex,
        topicId: topic.id,
        level: m.level,
      },
    });

    // Delete existing slides and questions for idempotent re-seed
    await prisma.learningSlide.deleteMany({ where: { moduleId: dbModule.id } });
    await prisma.quizQuestion.deleteMany({ where: { moduleId: dbModule.id } });

    // Create slides
    if (m.slides.length > 0) {
      await prisma.learningSlide.createMany({
        data: m.slides.map((s, i) => ({
          moduleId: dbModule.id,
          title: s.title,
          layoutType: s.layoutType,
          imageUrl: s.imageUrl,
          bullets: s.bullets,
          orderIndex: i,
        })),
      });
      slideTotal += m.slides.length;
    }

    // Create quiz questions
    if (m.quiz.length > 0) {
      await prisma.quizQuestion.createMany({
        data: m.quiz.map((q, i) => ({
          moduleId: dbModule.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: i,
        })),
      });
      questionTotal += m.quiz.length;
    }
  }

  console.log(`Seeded ${CURRICULUM_MODULES.length} modules, ${slideTotal} slides, ${questionTotal} questions!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
