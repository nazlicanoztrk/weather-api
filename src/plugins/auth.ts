import type { FastifyPluginCallback } from 'fastify';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const authRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  // Register route
  fastify.post('/register', async (request, reply) => {
    const { email, password, role } = request.body as {
      email: string;
      password: string;
      role: 'ADMIN' | 'USER';
    };

    if (!email || !password || !role) {
      return reply.status(400).send({ message: 'email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    return reply.status(201).send({
      message: 'User registered',
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  // Login route
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    return reply.send({ token });
  });

  done();
};
