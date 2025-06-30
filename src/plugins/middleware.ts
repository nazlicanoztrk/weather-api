import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Define request type that includes 'user'
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: number;
    role: string;
  };
}

// Middleware to verify JWT token
export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    (request as unknown as AuthenticatedRequest).user = decoded;
  } catch {
    return reply.status(401).send({ message: 'Invalid token' });
  }
}

// Middleware to allow only admin users
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as unknown as AuthenticatedRequest).user;

  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Access denied: admin role required' });
  }
}
