import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateQuizQuestionsForModule(moduleId: string, moduleName: string) {
  return [
    {
      question: `What is the primary architectural purpose of ${moduleName}?`,
      options: [
        `Automated provisioning and system backups.`,
        `Failsafe identity access and resources governance.`,
        `Low latency, secure file sharing.`,
        `Dynamic horizontal resource scaling.`
      ],
      answerIndex: 1,
      explanation: `${moduleName} provides policies and configurations specifically targeting cloud architecture structure, security limits, or resource orchestration.`
    },
    {
      question: `Which of the following is considered a core operational best practice for ${moduleName}?`,
      options: [
        `Granting root admin controls to all API callers.`,
        `Configuring open endpoints without authorization blocks.`,
        `Applying the principle of least privilege.`,
        `Avoiding access key rotations to preserve runtime consistency.`
      ],
      answerIndex: 2,
      explanation: `The principle of least privilege ensures users/roles only obtain the minimum permissions required for their actions, minimizing breach radius.`
    },
    {
      question: `How does ${moduleName} handle unexpected service interruptions or failures?`,
      options: [
        `By scaling down the entire fleet to prevent storage locks.`,
        `By utilizing automated multi-AZ standby failover replication.`,
        `By triggering manual shell restart triggers.`,
        `By transferring files to local backup endpoints.`
      ],
      answerIndex: 1,
      explanation: `AWS uses Multi-Availability Zone redundancy patterns to execute failover updates synchronously when primary databases or computing nodes crash.`
    }
  ];
}

async function main() {
  console.log('Seeding database...');

  // 1. Seed Demo Users
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

  // 2. Seed Modules
  const modulesFilePath = path.join(__dirname, 'modules.json');
  if (!fs.existsSync(modulesFilePath)) {
    console.error('modules.json not found! Please run node prisma/extract.js first.');
    return;
  }

  const rawModules = JSON.parse(fs.readFileSync(modulesFilePath, 'utf8'));

  for (let i = 0; i < rawModules.length; i++) {
    const m = rawModules[i];

    // Map tier based on level
    let tier = 'Fundamentals';
    if (m.level === 'Intermediate') {
      tier = 'Associate';
    } else if (m.level === 'Advanced') {
      tier = 'Professional';
    }

    // Clean estimated minutes to integer
    const minutesMatch = m.estimatedTime.match(/\d+/);
    const estimatedMinutes = minutesMatch ? parseInt(minutesMatch[0], 10) : 20;

    const dbModule = await prisma.module.upsert({
      where: { slug: m.id },
      update: {
        name: m.name,
        description: m.description,
        tier,
        xpPoints: m.points || 100,
        estimatedMinutes,
        orderIndex: i,
      },
      create: {
        name: m.name,
        description: m.description,
        tier,
        xpPoints: m.points || 100,
        estimatedMinutes,
        orderIndex: i,
        slug: m.id,
      },
    });

    // Create Slides
    await prisma.learningSlide.deleteMany({ where: { moduleId: dbModule.id } });

    const slidesData = (m.learningContent || []).map((slide: any, slideIdx: number) => {
      let layoutType = 'TEXT_ONLY';
      if (slide.layoutType === 'text-image') {
        layoutType = 'TEXT_IMAGE';
      } else if (slide.layoutType === 'image-only') {
        layoutType = 'IMAGE_ONLY';
      }

      return {
        moduleId: dbModule.id,
        title: slide.title || 'Slide Title',
        layoutType,
        imageUrl: slide.imageUrl || null,
        bullets: slide.content || [],
        orderIndex: slideIdx,
      };
    });

    if (slidesData.length > 0) {
      await prisma.learningSlide.createMany({
        data: slidesData,
      });
    }

    // Create Questions
    await prisma.quizQuestion.deleteMany({ where: { moduleId: dbModule.id } });

    // Use defined quizQuestions or fallback to template questions
    let questionsPool = m.quizQuestions || [];
    if (questionsPool.length === 0 && m.quiz) {
      questionsPool.push(m.quiz);
    }
    if (questionsPool.length === 0) {
      questionsPool = generateQuizQuestionsForModule(m.id, m.name);
    }

    const questionsData = questionsPool.map((q: any, qIdx: number) => {
      const letters = ['A', 'B', 'C', 'D'];
      const ansIdx = q.answerIndex !== undefined ? q.answerIndex : 0;
      const correctAnswer = letters[ansIdx] || 'A';

      return {
        moduleId: dbModule.id,
        question: q.question,
        optionA: q.options[0] || 'Option A',
        optionB: q.options[1] || 'Option B',
        optionC: q.options[2] || 'Option C',
        optionD: q.options[3] || 'Option D',
        correctAnswer,
        explanation: q.explanation || 'Explanation',
        orderIndex: qIdx,
      };
    });

    if (questionsData.length > 0) {
      await prisma.quizQuestion.createMany({
        data: questionsData,
      });
    }
  }

  console.log(`Seeded ${rawModules.length} modules, their slides, and questions!`);
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
