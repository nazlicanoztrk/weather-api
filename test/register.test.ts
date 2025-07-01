import Fastify from 'fastify';
import { authRoutes } from '../src/plugins/auth';
import { weatherRoutes } from '../src/plugins/weather';
import prisma from '../src/prisma';
import supertest from 'supertest';

let app: ReturnType<typeof Fastify>;
let userToken = '';
let adminToken = '';
let userId: number;

const userEmail = `user${Date.now()}@test.com`;
const adminEmail = `admin${Date.now()}@test.com`;
const password = '123456';

beforeAll(async () => {
    app = Fastify();
    app.register(authRoutes);
    app.register(weatherRoutes);
    await app.ready();
});

afterAll(async () => {
    await prisma.weatherQuery.deleteMany({
        where: {
            userId: {
                gt: 0,
            },
        },
    });

    await prisma.user.deleteMany({
        where: {
            email: {
                contains: '@test.com',
            },
        },
    });

    await app.close();
    await prisma.$disconnect();
});

describe('Full API Flow', () => {
    it('should register USER and ADMIN accounts', async () => {
        // User
        const resUser = await supertest(app.server).post('/register').send({
            email: userEmail,
            password,
            role: 'USER',
        });
        expect(resUser.statusCode).toBe(201);
        userId = resUser.body.user.id;

        // Admin
        const resAdmin = await supertest(app.server).post('/register').send({
            email: adminEmail,
            password,
            role: 'ADMIN',
        });
        expect(resAdmin.statusCode).toBe(201);
    });

    it('should login USER and get token', async () => {
        const res = await supertest(app.server).post('/login').send({
            email: userEmail,
            password,
        });
        expect(res.statusCode).toBe(200);
        userToken = res.body.token;
    });

    it('should login ADMIN and get token', async () => {
        const res = await supertest(app.server).post('/login').send({
            email: adminEmail,
            password,
        });
        expect(res.statusCode).toBe(200);
        adminToken = res.body.token;
    });

    it('USER should get weather data for city', async () => {
        const res = await supertest(app.server)
            .get('/weather?city=istanbul')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('main');
    });

    it("USER should get their own weather queries", async () => {
        const res = await supertest(app.server)
            .get('/weather/user')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('userId', userId);
    });

    it('ADMIN should get all weather queries', async () => {
        const res = await supertest(app.server)
            .get('/weather/all-queries')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('user');
    });
});
