# Weather API

A backend application built with Fastify and TypeScript. It allows users to register, authenticate, and query current weather data by city using the OpenWeather API. Results are cached in Redis for performance and scalability.

---

## Technologies Used

- **Fastify** (lightweight web framework)
- **TypeScript**
- **Prisma** (ORM)
- **PostgreSQL**
- **Redis** (for caching)
- **JWT** (for authentication)
- **OpenWeather API**
- **Postman** (for testing)
- **GitHub Actions** (for CI testing pipeline)

---

## Role-based Access

The application supports two roles:

- `USER`: Can only view their own weather queries.
- `ADMIN`: Can view all weather queries made by all users.

Roles are assigned during registration via `"role": "USER"` or `"role": "ADMIN"` field.

---

##  Setup Instructions

### 1. Clone the project and install dependencies

```bash
git clone https://github.com/nazlicanoztrk/weather-api.git
cd weather-api-case-study
npm install

### Environment Setup

You can copy the `.env.example` file and rename it to `.env`:

### Running with Docker

This project uses PostgreSQL and Redis. To run them locally with Docker, you can use the included `docker-compose.yml`.

```bash
docker-compose up -d

### OpenWeather API

This project uses the OpenWeather API to fetch city-based weather data.

You need to create your own API key from (https://openweathermap.org/api) and add it to your `.env` file:


### Initialize the Database (Prisma)

After setting up the environment variables and running the database containers, run the following command to apply Prisma migrations:

```bash
npx prisma migrate deploy