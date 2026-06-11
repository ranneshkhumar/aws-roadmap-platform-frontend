import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Curriculum Module (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let coreToken: string;
  let crewToken: string;
  let enthusiastToken: string;

  let testUserIds: string[] = [];
  let testModuleIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up any stray test data first
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['core@test.com', 'crew@test.com', 'enthusiast@test.com'],
        },
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create 3 users with different roles
    const coreUser = await prisma.user.create({
      data: {
        name: 'Core User',
        email: 'core@test.com',
        passwordHash,
        role: Role.CORE,
      },
    });
    testUserIds.push(coreUser.id);

    const crewUser = await prisma.user.create({
      data: {
        name: 'Crew User',
        email: 'crew@test.com',
        passwordHash,
        role: Role.CREW,
      },
    });
    testUserIds.push(crewUser.id);

    const enthusiastUser = await prisma.user.create({
      data: {
        name: 'Enthusiast User',
        email: 'enthusiast@test.com',
        passwordHash,
        role: Role.ENTHUSIAST,
      },
    });
    testUserIds.push(enthusiastUser.id);

    // Login each to get access tokens
    const loginUser = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(201);
      return res.body.accessToken;
    };

    coreToken = await loginUser('core@test.com');
    crewToken = await loginUser('crew@test.com');
    enthusiastToken = await loginUser('enthusiast@test.com');
  }, 30000);

  afterAll(async () => {
    // Cleanup databases
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });
    await app.close();
  }, 30000);

  describe('Authorization Rules', () => {
    it('should reject mutating endpoints if not logged in (anonymous)', async () => {
      await request(app.getHttpServer())
        .post('/modules')
        .send({
          name: 'Anonymous Module',
          description: 'Desc',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 30,
        })
        .expect(401);
    });

    it('should reject mutating endpoints for CREW users', async () => {
      await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          name: 'Crew Module',
          description: 'Desc',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 30,
        })
        .expect(403);
    });

    it('should reject mutating endpoints for ENTHUSIAST users', async () => {
      await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${enthusiastToken}`)
        .send({
          name: 'Enthusiast Module',
          description: 'Desc',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 30,
        })
        .expect(403);
    });
  });

  describe('CRUD operations & endpoints (CORE only)', () => {
    let createdModuleId: string;
    let createdSlug: string;

    it('should create a module successfully as CORE and auto-generate slug and default orderIndex', async () => {
      const res = await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          name: 'AWS Cloud Fundamentals',
          description: 'Introduction to basic cloud concepts and services',
          tier: 'Fundamentals',
          xpPoints: 150,
          estimatedMinutes: 45,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('AWS Cloud Fundamentals');
      expect(res.body.slug).toBe('aws-cloud-fundamentals');
      expect(res.body.orderIndex).toBe(0); // first item default

      createdModuleId = res.body.id;
      createdSlug = res.body.slug;
      testModuleIds.push(createdModuleId);
    });

    it('should assign incremental orderIndex on subsequent creations', async () => {
      const res = await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          name: 'AWS IAM & Security',
          description: 'Learn about roles, users and security policies',
          tier: 'Associate',
          xpPoints: 200,
          estimatedMinutes: 60,
        })
        .expect(201);

      expect(res.body.orderIndex).toBe(1); // incremented from 0
      testModuleIds.push(res.body.id);
    });

    it('should generate a unique slug resolving collisions', async () => {
      const res = await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          name: 'AWS IAM & Security', // Same name
          description: 'Another module with same name',
          tier: 'Associate',
          xpPoints: 200,
          estimatedMinutes: 60,
        })
        .expect(201);

      expect(res.body.slug).toBe('aws-iam-security-1'); // resolved uniqueness
      testModuleIds.push(res.body.id);
    });

    it('should return all modules ordered by orderIndex ascending on public list', async () => {
      const res = await request(app.getHttpServer())
        .get('/modules')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(3);
      expect(res.body[0].orderIndex).toBeLessThanOrEqual(res.body[1].orderIndex);
      expect(res.body[1].orderIndex).toBeLessThanOrEqual(res.body[2].orderIndex);
    });

    it('should return a module by ID publicly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${createdModuleId}`)
        .expect(200);

      expect(res.body.id).toBe(createdModuleId);
      expect(res.body).toHaveProperty('slides');
      expect(res.body).toHaveProperty('questions');
    });

    it('should return a module by slug publicly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/slug/${createdSlug}`)
        .expect(200);

      expect(res.body.id).toBe(createdModuleId);
      expect(res.body.slug).toBe(createdSlug);
    });

    it('should return modules by tier publicly', async () => {
      const res = await request(app.getHttpServer())
        .get('/modules/tier/Associate')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body[0].tier).toBe('Associate');
      expect(res.body[1].tier).toBe('Associate');
    });

    it('should update module metadata and regenerate slug if name changes', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/modules/${createdModuleId}`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          name: 'AWS Cloud Fundamentals V2',
          xpPoints: 180,
        })
        .expect(200);

      expect(res.body.name).toBe('AWS Cloud Fundamentals V2');
      expect(res.body.slug).toBe('aws-cloud-fundamentals-v2'); // updated
      expect(res.body.xpPoints).toBe(180);
    });

    it('should NOT regenerate slug if name does NOT change during metadata update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/modules/${createdModuleId}`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(res.body.slug).toBe('aws-cloud-fundamentals-v2'); // stays same
      expect(res.body.description).toBe('Updated description');
    });
  });

  describe('Duplication & Relations', () => {
    let sourceModuleId: string;
    let slideId: string;
    let questionId: string;

    beforeAll(async () => {
      // Create a module and add slide/question directly
      const sourceModule = await prisma.module.create({
        data: {
          name: 'Original Module',
          description: 'Desc',
          tier: 'Professional',
          xpPoints: 300,
          estimatedMinutes: 90,
          orderIndex: 10,
          slug: 'original-module',
        },
      });
      sourceModuleId = sourceModule.id;
      testModuleIds.push(sourceModuleId);

      const slide = await prisma.learningSlide.create({
        data: {
          moduleId: sourceModuleId,
          title: 'Original Slide',
          layoutType: 'hero',
          bullets: ['Point A', 'Point B'],
          orderIndex: 0,
        },
      });
      slideId = slide.id;

      const question = await prisma.quizQuestion.create({
        data: {
          moduleId: sourceModuleId,
          question: 'True or False?',
          optionA: 'True',
          optionB: 'False',
          optionC: 'N/A',
          optionD: 'N/A',
          correctAnswer: 'A',
          explanation: 'Because it is.',
          orderIndex: 0,
        },
      });
      questionId = question.id;
    });

    it('should duplicate metadata, slides and quiz questions with proper names and slug resolving', async () => {
      const res = await request(app.getHttpServer())
        .post(`/modules/${sourceModuleId}/duplicate`)
        .set('Authorization', `Bearer ${coreToken}`)
        .expect(201);

      expect(res.body.name).toBe('Original Module Copy');
      expect(res.body.slug).toBe('original-module-copy');
      expect(res.body.id).not.toBe(sourceModuleId);
      testModuleIds.push(res.body.id);

      // Verify slides are copied
      expect(res.body.slides).toHaveLength(1);
      expect(res.body.slides[0].id).not.toBe(slideId);
      expect(res.body.slides[0].title).toBe('Original Slide');

      // Verify questions are copied
      expect(res.body.questions).toHaveLength(1);
      expect(res.body.questions[0].id).not.toBe(questionId);
      expect(res.body.questions[0].question).toBe('True or False?');
    });
  });

  describe('Reordering', () => {
    it('should update orderIndex values using a transaction', async () => {
      // Let's get current module IDs
      const modulesBefore = await prisma.module.findMany({
        orderBy: { orderIndex: 'asc' },
      });
      expect(modulesBefore.length).toBeGreaterThanOrEqual(2);

      const idsInReverse = modulesBefore.map((m) => m.id).reverse();

      const res = await request(app.getHttpServer())
        .post('/modules/reorder')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({ ids: idsInReverse })
        .expect(201);

      expect(res.body.success).toBe(true);

      // Fetch from DB again to verify reorder
      const modulesAfter = await prisma.module.findMany({
        orderBy: { orderIndex: 'asc' },
      });

      const idsAfter = modulesAfter.map((m) => m.id);
      expect(idsAfter).toEqual(idsInReverse);
    });
  });

  describe('Validation & Error Handling', () => {
    it('should reject module creation with bad input (validation failed)', async () => {
      const res = await request(app.getHttpServer())
        .post('/modules')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          name: '', // Empty
          xpPoints: -10, // Negative
        })
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBeInstanceOf(Array); // validation error list
      expect(res.body.error).toBe('Bad Request');
    });

    it('should return 404 Not Found for non-existent module lookup without leaking implementation details', async () => {
      const res = await request(app.getHttpServer())
        .get('/modules/non-existent-id')
        .expect(404);

      expect(res.body.error).toBe('Not Found');
      expect(res.body.message).toContain('not found');
    });

    it('should return 404 Not Found for non-existent slug lookup without leaking implementation details', async () => {
      const res = await request(app.getHttpServer())
        .get('/modules/slug/some-non-existent-slug')
        .expect(404);

      expect(res.body.error).toBe('Not Found');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Hard Delete with Soft Delete Readiness', () => {
    it('should delete a module and cascade delete slides and questions', async () => {
      // Find a module with slides/questions
      const testModule = await prisma.module.findFirst({
        where: {
          name: 'Original Module Copy',
        },
        include: {
          slides: true,
          questions: true,
        },
      });

      expect(testModule).not.toBeNull();
      const moduleId = testModule!.id;
      const slideId = testModule!.slides[0].id;
      const questionId = testModule!.questions[0].id;

      await request(app.getHttpServer())
        .delete(`/modules/${moduleId}`)
        .set('Authorization', `Bearer ${coreToken}`)
        .expect(200);

      // Verify module is deleted
      const deletedModule = await prisma.module.findUnique({
        where: { id: moduleId },
      });
      expect(deletedModule).toBeNull();

      // Verify slides are cascade deleted
      const deletedSlide = await prisma.learningSlide.findUnique({
        where: { id: slideId },
      });
      expect(deletedSlide).toBeNull();

      // Verify questions are cascade deleted
      const deletedQuestion = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
      });
      expect(deletedQuestion).toBeNull();
    });
  });
});
