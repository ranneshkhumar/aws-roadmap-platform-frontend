import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Questions Module (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let coreToken: string;
  let crewToken: string;

  const testUserIds: string[] = [];
  let testModuleId: string;

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

    // Clean up databases
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['core-questions@test.com', 'crew-questions@test.com'],
        },
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create users
    const coreUser = await prisma.user.create({
      data: {
        name: 'Core User',
        email: 'core-questions@test.com',
        passwordHash,
        role: Role.CORE,
      },
    });
    testUserIds.push(coreUser.id);

    const crewUser = await prisma.user.create({
      data: {
        name: 'Crew User',
        email: 'crew-questions@test.com',
        passwordHash,
        role: Role.CREW,
      },
    });
    testUserIds.push(crewUser.id);

    // Login users
    const loginUser = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(201);
      return res.body.accessToken;
    };

    coreToken = await loginUser('core-questions@test.com');
    crewToken = await loginUser('crew-questions@test.com');

    // Create a test module
    const testModule = await prisma.module.create({
      data: {
        name: 'Questions Test Module',
        description: 'Module for testing questions api',
        tier: 'Fundamentals',
        xpPoints: 100,
        estimatedMinutes: 30,
        orderIndex: 0,
        slug: 'questions-test-module',
      },
    });
    testModuleId = testModule.id;
  }, 30000);

  afterAll(async () => {
    // Cleanup
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });
    await app.close();
  }, 30000);

  describe('GET /modules/:moduleId/questions', () => {
    it('should return 200 OK with an empty array when no questions exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/questions`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return 404 Not Found for non-existent module', async () => {
      await request(app.getHttpServer())
        .get('/modules/non-existent-module-id/questions')
        .expect(404);
    });
  });

  describe('PUT /modules/:moduleId/questions', () => {
    it('should reject requests without a token', async () => {
      await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/questions`)
        .send({ questions: [] })
        .expect(401);
    });

    it('should reject requests for CREW roles', async () => {
      await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/questions`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ questions: [] })
        .expect(403);
    });

    it('should reject invalid correctAnswer (e.g. lowercase a)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/questions`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          questions: [
            {
              question: 'Who created AWS?',
              optionA: 'Amazon',
              optionB: 'Google',
              optionC: 'Microsoft',
              optionD: 'Apple',
              correctAnswer: 'a', // should be uppercase A
              explanation: 'Amazon Web Services was launched by Amazon.',
              orderIndex: 0,
            },
          ],
        })
        .expect(400);

      expect(res.body.message[0]).toContain('correctAnswer must be one of');
    });

    it('should accept valid correctAnswer, sync successfully as CORE, and strip database IDs', async () => {
      const payload = {
        questions: [
          {
            question: 'What is S3?',
            optionA: 'Simple Storage Service',
            optionB: 'Secure Storage Service',
            optionC: 'Stripe Storage Solution',
            optionD: 'None of the above',
            correctAnswer: 'A',
            explanation: 'S3 stands for Simple Storage Service.',
            orderIndex: 1,
          },
          {
            question: 'Who created AWS?',
            optionA: 'Amazon',
            optionB: 'Google',
            optionC: 'Microsoft',
            optionD: 'Apple',
            correctAnswer: 'A',
            explanation: 'Amazon Web Services was launched by Amazon.',
            orderIndex: 0,
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/questions`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send(payload)
        .expect(200);

      expect(res.body).toHaveLength(2);

      // Verify ordering is preserved based on orderIndex (Who created AWS should be first, What is S3 second)
      expect(res.body[0].question).toBe('Who created AWS?');
      expect(res.body[1].question).toBe('What is S3?');

      // Verify that database identifiers and timestamps are stripped
      expect(res.body[0]).not.toHaveProperty('id');
      expect(res.body[0]).not.toHaveProperty('moduleId');
      expect(res.body[0]).not.toHaveProperty('createdAt');
      expect(res.body[0]).not.toHaveProperty('updatedAt');

      // Verify stored properties are accurate
      expect(res.body[0].correctAnswer).toBe('A');
      expect(res.body[1].optionC).toBe('Stripe Storage Solution');
      expect(res.body[1].explanation).toBe(
        'S3 stands for Simple Storage Service.',
      );
    });

    it('should overwrite existing questions on subsequent syncs', async () => {
      // Perform another sync with 1 question
      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/questions`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          questions: [
            {
              question: 'Replacement Question',
              optionA: 'A',
              optionB: 'B',
              optionC: 'C',
              optionD: 'D',
              correctAnswer: 'B',
              explanation: 'Because B is correct.',
              orderIndex: 0,
            },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].question).toBe('Replacement Question');
      expect(res.body[0].correctAnswer).toBe('B');

      // Verify in DB that only 1 question exists now
      const dbQuestions = await prisma.quizQuestion.findMany({
        where: { moduleId: testModuleId },
      });
      expect(dbQuestions).toHaveLength(1);
    });

    it('should return 404 Not Found if syncing questions for non-existent module', async () => {
      await request(app.getHttpServer())
        .put('/modules/non-existent-module-id/questions')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({ questions: [] })
        .expect(404);
    });
  });

  describe('GET /modules/:moduleId/questions (After synchronization)', () => {
    it('should retrieve synced questions ordered by orderIndex ascending with stripped IDs and stripped correctAnswer publicly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/questions`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].question).toBe('Replacement Question');
      expect(res.body[0]).not.toHaveProperty('id');
      expect(res.body[0]).not.toHaveProperty('moduleId');
      expect(res.body[0]).not.toHaveProperty('correctAnswer');
    });
  });
});
