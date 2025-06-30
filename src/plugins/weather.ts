import { FastifyInstance, FastifyRequest, FastifyPluginCallback } from 'fastify';
import axios from 'axios';
import prisma from '../prisma';
import Redis from 'ioredis';
import { verifyToken, requireAdmin } from './middleware';

const redis = new Redis(6380);
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS) || 600;

if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY not found');
}

interface WeatherRequestQuery {
    city: string;
}

interface AuthenticatedRequest extends FastifyRequest {
    user: { userId: number; role: string };
    query: WeatherRequestQuery;
}
export const weatherRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    
    
    // Get weather for a city
    fastify.get('/weather', { preHandler: [verifyToken] }, async (request, reply) => {
        const req = request as unknown as AuthenticatedRequest;
        const { user, query } = req;
        const { city } = query;

        if (!city) {
            return reply.status(400).send({ message: 'City is required' });
        }

        const cacheKey = `weather:${city.toLowerCase()}`;
        const cached = await redis.get(cacheKey);

        let weatherData;
        if (cached) {
            weatherData = JSON.parse(cached);
        } else {
            try {
                const res = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
                );
                weatherData = res.data;
                await redis.set(cacheKey, JSON.stringify(weatherData), 'EX', CACHE_TTL);
            } catch (error) {
                return reply.status(500).send({ message: 'Error fetching weather data' });
            }
        }

        const newQuery = {
            city: city,
            result: weatherData,
            userId: user.userId,
        };

        await prisma.weatherQuery.create({ data: newQuery });

        return reply.send(weatherData);
    });

    // Get User's weather query
    fastify.get('/weather/user', { preHandler: [verifyToken] }, async (request, reply) => {
        const user = (request as unknown as { user: { userId: number } }).user;

        const queries = await prisma.weatherQuery.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
        });

        return reply.send(queries);
    });

    // Admin: get all-queries weather query
    fastify.get('/weather/all-queries', { preHandler: [verifyToken, requireAdmin] }, async (_request, reply) => {
        const queries = await prisma.weatherQuery.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });

        return reply.send(queries);
    });

    done();
};
