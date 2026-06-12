import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Progress Module (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let learnerToken: string;
  let learnerId: string;

  let moduleAId: string;
  let moduleBId: string;
  let questionA1Id: string;
  let questionA2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up database tables
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['learner-progress@test.com'],
        },
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create a learner user
    const user = await prisma.user.create({
      data: {
        name: 'Learner Progress Test',
        email: 'learner-progress@test.com',
        passwordHash,
        role: Role.ENTHUSIAST,
        xp: 0,
        streak: 3,
      },
    });
    learnerId = user.id;

    // Login user to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'learner-progress@test.com', password: 'Password123!' })
      .expect(201);
    learnerToken = loginRes.body.accessToken;

    // Create Module A (orderIndex = 0, xp = 100)
    const moduleA = await prisma.module.create({
      data: {
        name: 'Module A',
        description: 'VPC and Subnetting',
        tier: 'Fundamentals',
        xpPoints: 100,
        estimatedMinutes: 20,
        orderIndex: 0,
        slug: 'module-a',
      },
    });
    moduleAId = moduleA.id;

    // Create Module B (orderIndex = 1, xp = 150)
    const moduleB = await prisma.module.create({
      data: {
        name: 'Module B',
        description: 'EC2 Auto Scaling',
        tier: 'Associate',
        xpPoints: 150,
        estimatedMinutes: 30,
        orderIndex: 1,
        slug: 'module-b',
      },
    });
    moduleBId = moduleB.id;

    // Create 2 questions for Module A
    const q1 = await prisma.quizQuestion.create({
      data: {
        moduleId: moduleAId,
        question: 'What is a subnet?',
        optionA: 'Option A',
        optionB: 'Option B',
        optionC: 'Option C',
        optionD: 'Option D',
        correctAnswer: 'A',
        explanation: 'Option A explanation',
        orderIndex: 0,
      },
    });
    questionA1Id = q1.id;

    const q2 = await prisma.quizQuestion.create({
      data: {
        moduleId: moduleAId,
        question: 'What is a route table?',
        optionA: 'Option A',
        optionB: 'Option B',
        optionC: 'Option C',
        optionD: 'Option D',
        correctAnswer: 'B',
        explanation: 'Option B explanation',
        orderIndex: 1,
      },
    });
    questionA2Id = q2.id;
  }, 30000);

  afterAll(async () => {
    // Teardown
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: learnerId },
    });
    await app.close();
  }, 30000);

  describe('GET /progress/me (Initial state)', () => {
    it('should return initial progress with 0 XP and implicitly unlock Module A (first module)', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(res.body.currentXP).toBe(0);
      expect(res.body.streak).toBe(3);
      expect(res.body.completedModules).toEqual([]);
      expect(res.body.unlockedModules).toEqual([moduleAId]); // implicitly unlocked
    });
  });

  describe('GET /modules/:moduleId/progress (Initial state)', () => {
    it('should return UNLOCKED for the first module (Module A) implicitly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${moduleAId}/progress`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(res.body.status).toBe('UNLOCKED');
    });

    it('should return LOCKED for the second module (Module B) initially', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${moduleBId}/progress`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(res.body.status).toBe('LOCKED');
    });
  });

  describe('POST /modules/:moduleId/quiz/attempt', () => {
    it('should reject unauthorized attempts', async () => {
      await request(app.getHttpServer())
        .post(`/modules/${moduleAId}/quiz/attempt`)
        .send({ answers: [] })
        .expect(401);
    });

    it('should reject malformed answers options (validation check)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/modules/${moduleAId}/quiz/attempt`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            {
              questionOrder: 0,
              selectedAnswer: 'E', // invalid (must be A, B, C, D)
            },
          ],
        })
        .expect(400);

      expect(res.body.message[0]).toContain('selectedAnswer must be one of');
    });

    it('should score 100% correct, calculate XP (100 + 100 = 200), increment user XP, complete module, and unlock next module', async () => {
      const res = await request(app.getHttpServer())
        .post(`/modules/${moduleAId}/quiz/attempt`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            { questionOrder: 0, selectedAnswer: 'A' }, // correct
            { questionOrder: 1, selectedAnswer: 'B' }, // correct
          ],
        })
        .expect(201);

      expect(res.body.correctAnswers).toBe(2);
      expect(res.body.totalQuestions).toBe(2);
      expect(res.body.percentage).toBe(100);
      expect(res.body.xpEarned).toBe(200); // 100 + (2/2)*100 = 200 XP

      // Check User's total XP inside database
      const user = await prisma.user.findUnique({ where: { id: learnerId } });
      expect(user!.xp).toBe(200);

      // Verify that progress status is now COMPLETED for Module A
      const progressA = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleAId } },
      });
      expect(progressA!.status).toBe('COMPLETED');
      expect(progressA!.score).toBe(2);
      expect(progressA!.xpEarned).toBe(200);

      // Verify that Module B is now UNLOCKED
      const progressB = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleBId } },
      });
      expect(progressB!.status).toBe('UNLOCKED');
    });

    it('should apply XP Anti-Farming: subsequent attempts award 0 XP and keep highest score', async () => {
      // Retake with 1/2 correct (50% score)
      const res = await request(app.getHttpServer())
        .post(`/modules/${moduleAId}/quiz/attempt`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            { questionOrder: 0, selectedAnswer: 'A' }, // correct
            { questionOrder: 1, selectedAnswer: 'A' }, // incorrect
          ],
        })
        .expect(201);

      expect(res.body.correctAnswers).toBe(1);
      expect(res.body.totalQuestions).toBe(2);
      expect(res.body.xpEarned).toBe(0); // 0 XP awarded due to anti-farming

      // Verify user's total XP is unchanged (still 200)
      const user = await prisma.user.findUnique({ where: { id: learnerId } });
      expect(user!.xp).toBe(200);

      // Verify score in progress is still 2 (highest score kept)
      const progressA = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleAId } },
      });
      expect(progressA!.score).toBe(2); // Kept the 100% score (2) rather than dropping to 1
    });

    it('should update progress score if a retake scores higher', async () => {
      // Let's manually downgrade the stored score to 1 to test improvement
      await prisma.userModuleProgress.update({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleAId } },
        data: { score: 1 },
      });

      // Retake with 2/2 correct (100%)
      await request(app.getHttpServer())
        .post(`/modules/${moduleAId}/quiz/attempt`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            { questionOrder: 0, selectedAnswer: 'A' },
            { questionOrder: 1, selectedAnswer: 'B' },
          ],
        })
        .expect(201);

      // Verify score in progress updated to 2
      const progressA = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleAId } },
      });
      expect(progressA!.score).toBe(2);
    });
  });

  describe('GET /progress/me (After completion)', () => {
    it('should reflect correct XP and completed/unlocked lists', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      expect(res.body.currentXP).toBe(200);
      expect(res.body.completedModules).toEqual([moduleAId]);
      expect(res.body.unlockedModules).toEqual([moduleBId]);
    });
  });
});
