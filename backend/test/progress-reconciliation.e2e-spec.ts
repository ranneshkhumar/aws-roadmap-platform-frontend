import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Progress Reconciliation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let learnerToken: string;
  let learnerId: string;

  const testEmail = 'learner-reconciliation@test.com';

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

    // Clean up
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Create learner
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Reconciliation Test Learner',
        email: testEmail,
        passwordHash,
        role: Role.ENTHUSIAST,
        xp: 0,
        streak: 0,
      },
    });
    learnerId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'Password123!' })
      .expect(201);
    learnerToken = loginRes.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.user.deleteMany({ where: { id: learnerId } });
    await app.close();
  }, 30000);

  // Helper: create a module with a quiz question
  async function createModule(
    name: string,
    orderIndex: number,
    tier = 'Fundamentals',
  ) {
    const mod = await prisma.module.create({
      data: {
        name,
        description: `${name} description`,
        tier,
        xpPoints: 100,
        estimatedMinutes: 10,
        orderIndex,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      },
    });
    await prisma.quizQuestion.create({
      data: {
        moduleId: mod.id,
        question: `Question for ${name}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
        explanation: 'Explanation',
        orderIndex: 0,
      },
    });
    return mod;
  }

  // Helper: complete a module via quiz
  async function completeModule(moduleId: string) {
    await request(app.getHttpServer())
      .post(`/modules/${moduleId}/quiz/attempt`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ answers: [{ questionOrder: 0, selectedAnswer: 'A' }] })
      .expect(201);
  }

  // Helper: get progress
  async function getProgress() {
    const res = await request(app.getHttpServer())
      .get('/progress/me')
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200);
    return res.body;
  }

  // Helper: set module progress directly
  async function setProgress(
    moduleId: string,
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED',
  ) {
    await prisma.userModuleProgress.upsert({
      where: { userId_moduleId: { userId: learnerId, moduleId } },
      create: { userId: learnerId, moduleId, status },
      update: { status },
    });
  }

  // Helper: clean all modules and progress
  async function cleanSlate() {
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
  }

  describe('Scenario A: Learner completed all modules, new module inserted in middle', () => {
    let moduleA: any,
      moduleB: any,
      moduleC: any,
      moduleD: any,
      moduleE: any,
      moduleF: any;
    let moduleG: any;

    beforeAll(async () => {
      await cleanSlate();

      // Original curriculum: A B C D E F
      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);
      moduleC = await createModule('C', 2);
      moduleD = await createModule('D', 3);
      moduleE = await createModule('E', 4);
      moduleF = await createModule('F', 5);

      // Complete all modules
      await completeModule(moduleA.id);
      await completeModule(moduleB.id);
      await completeModule(moduleC.id);
      await completeModule(moduleD.id);
      await completeModule(moduleE.id);
      await completeModule(moduleF.id);

      // Verify all completed
      const progress = await getProgress();
      expect(progress.completedModules.length).toBe(6);

      // Insert G after B (orderIndex 2, shifting C-F)
      moduleG = await prisma.module.create({
        data: {
          name: 'G',
          description: 'G description',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 10,
          orderIndex: 2,
          slug: 'g',
        },
      });
      await prisma.quizQuestion.create({
        data: {
          moduleId: moduleG.id,
          question: 'Question G',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'Exp',
          orderIndex: 0,
        },
      });

      // Reindex C-F to make room: C=3, D=4, E=5, F=6
      await prisma.module.update({
        where: { id: moduleC.id },
        data: { orderIndex: 3 },
      });
      await prisma.module.update({
        where: { id: moduleD.id },
        data: { orderIndex: 4 },
      });
      await prisma.module.update({
        where: { id: moduleE.id },
        data: { orderIndex: 5 },
      });
      await prisma.module.update({
        where: { id: moduleF.id },
        data: { orderIndex: 6 },
      });
    }, 30000);

    it('should unlock only G (first missing), lock all others', async () => {
      const progress = await getProgress();

      expect(progress.completedModules.sort()).toEqual(
        [
          moduleA.id,
          moduleB.id,
          moduleC.id,
          moduleD.id,
          moduleE.id,
          moduleF.id,
        ].sort(),
      );
      expect(progress.unlockedModules).toEqual([moduleG.id]);
    });

    it('should persist reconciliation in database', async () => {
      const progressG = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleG.id } },
      });
      expect(progressG!.status).toBe('UNLOCKED');

      // Verify no other UNLOCKED records exist
      const allUnlocked = await prisma.userModuleProgress.findMany({
        where: { userId: learnerId, status: 'UNLOCKED' },
      });
      expect(allUnlocked.length).toBe(1);
      expect(allUnlocked[0].moduleId).toBe(moduleG.id);
    });
  });

  describe('Scenario B: Insert prerequisite before current unlocked module', () => {
    let moduleA: any, moduleB: any, moduleC: any;
    let moduleG: any;

    beforeAll(async () => {
      await cleanSlate();

      // Original: A B C
      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);
      moduleC = await createModule('C', 2);

      // Complete A, B → C is UNLOCKED
      await completeModule(moduleA.id);
      await completeModule(moduleB.id);

      const progress = await getProgress();
      expect(progress.completedModules.sort()).toEqual(
        [moduleA.id, moduleB.id].sort(),
      );
      expect(progress.unlockedModules).toEqual([moduleC.id]);

      // Insert G before C (as new prerequisite)
      moduleG = await prisma.module.create({
        data: {
          name: 'G-Prereq',
          description: 'G description',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 10,
          orderIndex: 2,
          slug: 'g-prereq',
        },
      });
      await prisma.quizQuestion.create({
        data: {
          moduleId: moduleG.id,
          question: 'Question G',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'Exp',
          orderIndex: 0,
        },
      });

      // Shift C to orderIndex 3
      await prisma.module.update({
        where: { id: moduleC.id },
        data: { orderIndex: 3 },
      });
    }, 30000);

    it('should unlock G, re-lock C (previously unlocked)', async () => {
      const progress = await getProgress();

      expect(progress.completedModules.sort()).toEqual(
        [moduleA.id, moduleB.id].sort(),
      );
      expect(progress.unlockedModules).toEqual([moduleG.id]);

      // C should no longer be in unlockedModules
      expect(progress.unlockedModules).not.toContain(moduleC.id);
    });

    it('should persist C as LOCKED in database', async () => {
      const progressC = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: moduleC.id } },
      });
      expect(progressC!.status).toBe('LOCKED');
    });
  });

  describe('Scenario C: New island after curriculum completion', () => {
    let moduleA: any, moduleB: any;
    let moduleG: any, moduleH: any;

    beforeAll(async () => {
      await cleanSlate();

      // Original: A B
      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);

      await completeModule(moduleA.id);
      await completeModule(moduleB.id);

      // New island: G, H (after B)
      moduleG = await createModule('G', 2, 'Associate');
      moduleH = await createModule('H', 3, 'Associate');
    }, 30000);

    it('should unlock G (first module of new island), lock H', async () => {
      const progress = await getProgress();

      expect(progress.completedModules.sort()).toEqual(
        [moduleA.id, moduleB.id].sort(),
      );
      expect(progress.unlockedModules).toEqual([moduleG.id]);
    });
  });

  describe('Scenario D: Reorder modules after learner progress', () => {
    let moduleA: any, moduleB: any, moduleC: any;

    beforeAll(async () => {
      await cleanSlate();

      // Original order: A(0) B(1) C(2)
      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);
      moduleC = await createModule('C', 2);

      // Complete A only → B is UNLOCKED
      await completeModule(moduleA.id);

      const progress = await getProgress();
      expect(progress.completedModules).toEqual([moduleA.id]);
      expect(progress.unlockedModules).toEqual([moduleB.id]);

      // Reorder: C(0) A(1) B(2) — C is now first
      await prisma.module.update({
        where: { id: moduleC.id },
        data: { orderIndex: 0 },
      });
      await prisma.module.update({
        where: { id: moduleA.id },
        data: { orderIndex: 1 },
      });
      await prisma.module.update({
        where: { id: moduleB.id },
        data: { orderIndex: 2 },
      });
    }, 30000);

    it('should unlock C (now first in order, not completed), keep A completed, lock B', async () => {
      const progress = await getProgress();

      // A is still completed
      expect(progress.completedModules).toEqual([moduleA.id]);

      // C is first in new order and not completed → should be unlocked
      expect(progress.unlockedModules).toContain(moduleC.id);

      // Only one module should be unlocked
      expect(progress.unlockedModules.length).toBe(1);
    });
  });

  describe('Scenario E: Brand new learner', () => {
    let newLearnerToken: string;
    let newLearnerId: string;
    let moduleA: any, moduleB: any, moduleC: any;

    beforeAll(async () => {
      await cleanSlate();

      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);
      moduleC = await createModule('C', 2);

      // Create new learner with no progress
      const passwordHash = await bcrypt.hash('Password123!', 10);
      const email = 'new-learner-reconciliation@test.com';
      await prisma.user.deleteMany({ where: { email } });

      const user = await prisma.user.create({
        data: {
          name: 'New Learner',
          email,
          passwordHash,
          role: Role.ENTHUSIAST,
          xp: 0,
          streak: 0,
        },
      });
      newLearnerId = user.id;

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(201);
      newLearnerToken = loginRes.body.accessToken;
    }, 30000);

    afterAll(async () => {
      await prisma.userModuleProgress.deleteMany({
        where: { userId: newLearnerId },
      });
      await prisma.user.deleteMany({ where: { id: newLearnerId } });
    }, 30000);

    it('should unlock only the first module, lock all others', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/me')
        .set('Authorization', `Bearer ${newLearnerToken}`)
        .expect(200);

      expect(res.body.completedModules).toEqual([]);
      expect(res.body.unlockedModules).toEqual([moduleA.id]);
    });
  });

  describe('Edge Case: Multiple insertions at different positions', () => {
    let moduleA: any, moduleB: any, moduleC: any, moduleD: any, moduleE: any;
    let moduleX: any, moduleY: any;

    beforeAll(async () => {
      await cleanSlate();

      // Original: A B C D E
      moduleA = await createModule('A', 0);
      moduleB = await createModule('B', 1);
      moduleC = await createModule('C', 2);
      moduleD = await createModule('D', 3);
      moduleE = await createModule('E', 4);

      // Complete A B C → D is UNLOCKED
      await completeModule(moduleA.id);
      await completeModule(moduleB.id);
      await completeModule(moduleC.id);

      // Insert X after A (orderIndex 1), Y after C (orderIndex 4)
      moduleX = await prisma.module.create({
        data: {
          name: 'X',
          description: 'X desc',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 10,
          orderIndex: 1,
          slug: 'x',
        },
      });
      await prisma.quizQuestion.create({
        data: {
          moduleId: moduleX.id,
          question: 'Q',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'E',
          orderIndex: 0,
        },
      });

      moduleY = await prisma.module.create({
        data: {
          name: 'Y',
          description: 'Y desc',
          tier: 'Fundamentals',
          xpPoints: 100,
          estimatedMinutes: 10,
          orderIndex: 4,
          slug: 'y',
        },
      });
      await prisma.quizQuestion.create({
        data: {
          moduleId: moduleY.id,
          question: 'Q',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'E',
          orderIndex: 0,
        },
      });

      // Reindex: B=2, C=3, D=5, E=6
      await prisma.module.update({
        where: { id: moduleB.id },
        data: { orderIndex: 2 },
      });
      await prisma.module.update({
        where: { id: moduleC.id },
        data: { orderIndex: 3 },
      });
      await prisma.module.update({
        where: { id: moduleD.id },
        data: { orderIndex: 5 },
      });
      await prisma.module.update({
        where: { id: moduleE.id },
        data: { orderIndex: 6 },
      });
    }, 30000);

    it('should unlock only X (first missing in new order), lock everything after', async () => {
      const progress = await getProgress();

      // A B C still completed
      expect(progress.completedModules.sort()).toEqual(
        [moduleA.id, moduleB.id, moduleC.id].sort(),
      );

      // X is first unsatisfied (new order: A=0, X=1, B=2, C=3, Y=4, D=5, E=6)
      expect(progress.unlockedModules).toEqual([moduleX.id]);
    });
  });
});
