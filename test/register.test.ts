import supertest from 'supertest';
import Fastify from 'fastify';
import { authRoutes } from '../src/plugins/auth';
import { weatherRoutes } from '../src/plugins/weather';
import prisma from '../src/prisma';

let app: ReturnType<typeof Fastify>;
let token: string;
let adminToken: string;
let userId: number;

beforeAll(async () => {
  app = Fastify();
  app.register(authRoutes);
  app.register(weatherRoutes);
  await app.ready();

  await prisma.weatherQuery.deleteMany();
  await prisma.user.deleteMany();

  const userRes = await supertest(app.server).post('/register').send({
    email: 'user@example.com',
    password: '123456',
    role: 'USER',
  });
  token = (await supertest(app.server).post('/login').send({
    email: 'user@example.com',
    password: '123456',
  })).body.token;
  userId = userRes.body.user.id;

  const adminRes = await supertest(app.server).post('/register').send({
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  });
  adminToken = (await supertest(app.server).post('/login').send({
    email: 'admin@example.com',
    password: 'admin123',
  })).body.token;
}, 30000);

afterAll(async () => {
  await prisma.weatherQuery.deleteMany();
  await prisma.user.deleteMany();
  await app.close();
}, 20000);

describe('Full API Flow', () => {
  it('USER should get weather data for city', async () => {
    const res = await supertest(app.server)
      .get('/weather?city=istanbul')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('main');
  }, 10000);

  it("USER should get their own weather queries", async () => {
    const res = await supertest(app.server)
      .get('/weather/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('userId', userId);
  }, 10000);

  it("ADMIN should get all weather queries", async () => {
    const res = await supertest(app.server)
      .get('/weather/all-queries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('user');
  }, 10000);
});
