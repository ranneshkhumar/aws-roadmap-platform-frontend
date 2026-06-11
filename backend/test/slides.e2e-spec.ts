import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Slides Module (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let coreToken: string;
  let crewToken: string;

  let testUserIds: string[] = [];
  let testModuleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
          in: ['core-slides@test.com', 'crew-slides@test.com'],
        },
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create users
    const coreUser = await prisma.user.create({
      data: {
        name: 'Core User',
        email: 'core-slides@test.com',
        passwordHash,
        role: Role.CORE,
      },
    });
    testUserIds.push(coreUser.id);

    const crewUser = await prisma.user.create({
      data: {
        name: 'Crew User',
        email: 'crew-slides@test.com',
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

    coreToken = await loginUser('core-slides@test.com');
    crewToken = await loginUser('crew-slides@test.com');

    // Create a test module
    const testModule = await prisma.module.create({
      data: {
        name: 'Slides Test Module',
        description: 'Module for testing slides api',
        tier: 'Fundamentals',
        xpPoints: 100,
        estimatedMinutes: 30,
        orderIndex: 0,
        slug: 'slides-test-module',
      },
    });
    testModuleId = testModule.id;
  }, 30000);

  afterAll(async () => {
    // Cleanup
    await prisma.learningSlide.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });
    await app.close();
  }, 30000);

  describe('GET /modules/:moduleId/slides', () => {
    it('should return 200 OK with an empty array when no slides exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/slides`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return 404 Not Found for non-existent module', async () => {
      await request(app.getHttpServer())
        .get('/modules/non-existent-module-id/slides')
        .expect(404);
    });
  });

  describe('PUT /modules/:moduleId/slides', () => {
    it('should reject requests without a token', async () => {
      await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/slides`)
        .send({ slides: [] })
        .expect(401);
    });

    it('should reject requests for CREW roles', async () => {
      await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/slides`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ slides: [] })
        .expect(403);
    });

    it('should reject invalid layoutType (e.g. lowercase text-only)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/slides`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          slides: [
            {
              title: 'Slide 1',
              layoutType: 'text-only', // should be uppercase TEXT_ONLY
              orderIndex: 0,
            },
          ],
        })
        .expect(400);

      expect(res.body.message[0]).toContain('layoutType must be one of');
    });

    it('should accept valid layoutType, sync successfully as CORE, and strip database IDs', async () => {
      const payload = {
        slides: [
          {
            title: 'Concept Slide',
            layoutType: 'TEXT_IMAGE',
            orderIndex: 1,
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAA...',
            bullets: ['Point 1', 'Point 2'],
          },
          {
            title: 'Welcome Slide',
            layoutType: 'TEXT_ONLY',
            orderIndex: 0,
            bullets: ['Start here'],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/slides`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send(payload)
        .expect(200);

      expect(res.body).toHaveLength(2);
      
      // Verify ordering is preserved based on orderIndex (Welcome Slide should be first, Concept Slide second)
      expect(res.body[0].title).toBe('Welcome Slide');
      expect(res.body[1].title).toBe('Concept Slide');

      // Verify that database identifiers and timestamps are stripped
      expect(res.body[0]).not.toHaveProperty('id');
      expect(res.body[0]).not.toHaveProperty('moduleId');
      expect(res.body[0]).not.toHaveProperty('createdAt');
      expect(res.body[0]).not.toHaveProperty('updatedAt');

      // Verify stored properties are accurate
      expect(res.body[0].layoutType).toBe('TEXT_ONLY');
      expect(res.body[1].layoutType).toBe('TEXT_IMAGE');
      expect(res.body[1].imageUrl).toBe('data:image/png;base64,iVBORw0KGgoAAA...');
      expect(res.body[1].bullets).toEqual(['Point 1', 'Point 2']);
    });

    it('should overwrite existing slides on subsequent syncs', async () => {
      // Perform another sync with 1 slide
      const res = await request(app.getHttpServer())
        .put(`/modules/${testModuleId}/slides`)
        .set('Authorization', `Bearer ${coreToken}`)
        .send({
          slides: [
            {
              title: 'Single Slide Replacement',
              layoutType: 'IMAGE_ONLY',
              orderIndex: 0,
              imageUrl: 's3://some-bucket/image.png',
            },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Single Slide Replacement');
      expect(res.body[0].layoutType).toBe('IMAGE_ONLY');
      expect(res.body[0].imageUrl).toBe('s3://some-bucket/image.png');

      // Verify in DB that only 1 slide exists now
      const dbSlides = await prisma.learningSlide.findMany({
        where: { moduleId: testModuleId },
      });
      expect(dbSlides).toHaveLength(1);
    });

    it('should return 404 Not Found if syncing slides for non-existent module', async () => {
      await request(app.getHttpServer())
        .put('/modules/non-existent-module-id/slides')
        .set('Authorization', `Bearer ${coreToken}`)
        .send({ slides: [] })
        .expect(404);
    });
  });

  describe('GET /modules/:moduleId/slides (After synchronization)', () => {
    it('should retrieve synced slides ordered by orderIndex ascending with stripped IDs publicly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/slides`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Single Slide Replacement');
      expect(res.body[0]).not.toHaveProperty('id');
      expect(res.body[0]).not.toHaveProperty('moduleId');
    });
  });
});
