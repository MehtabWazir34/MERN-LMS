# LMS Backend

The API is organized by responsibility so feature modules can grow without coupling transport, business logic, and persistence:

```text
src/
  config/       environment and database setup
  constants/    shared application constants
  controllers/  HTTP request handlers
  middleware/   cross-cutting request and error middleware
  models/       Mongoose schemas and models
  routes/       versioned HTTP route definitions
  services/     business use cases and integrations
  utils/        reusable implementation helpers
  validators/   request validation schemas
  app.js        Express application composition
  server.js     process bootstrap and database startup
```

The API is versioned under `/api/v1`. A health endpoint is available at `/api/v1/health` once MongoDB is running and dependencies are installed.