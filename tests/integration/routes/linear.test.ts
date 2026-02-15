import request from 'supertest';
import express from 'express';
import { createRouter } from '../../../src/core/router';
import { registry } from '../../../src/core/registry';
import { errorHandler } from '../../../src/middleware/errorHandler';
import type { AppPlugin } from '../../../src/core/types';

// Create a mock plugin for testing
const mockPlugin: AppPlugin = {
  name: 'linear',
  version: '1.0.0',
  description: 'Test Linear plugin',
  paths: [
    {
      name: 'my-issues',
      description: 'Fetch assigned issues',
      handler: (_req, res) => {
        res.json({
          app: 'linear',
          path: 'my-issues',
          data: {
            issues: [
              {
                id: 'issue-1',
                identifier: 'ENG-123',
                title: 'Test Issue',
              },
            ],
            count: 1,
          },
          timestamp: new Date().toISOString(),
        });
      },
    },
  ],
  initialize: jest.fn().mockResolvedValue(undefined),
};

// Set up test app
function createTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/', createRouter());
  app.use(errorHandler);
  return app;
}

describe('API Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    // Register mock plugin
    registry.registerPlugin(mockPlugin);
    app = createTestApp();
  });

  describe('GET /items', () => {
    it('should return all registered apps', async () => {
      const res = await request(app).get('/items');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('apps');
      expect(res.body).toHaveProperty('count');
      expect(res.body.apps).toContain('linear');
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /list/:app', () => {
    it('should return paths for a registered app', async () => {
      const res = await request(app).get('/list/linear');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('app', 'linear');
      expect(res.body).toHaveProperty('paths');
      expect(res.body).toHaveProperty('count');
      expect(res.body.paths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my-issues',
            description: 'Fetch assigned issues',
          }),
        ]),
      );
    });

    it('should return 404 for unknown app', async () => {
      const res = await request(app).get('/list/unknown');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('not found');
    });
  });

  describe('GET /:app/:path', () => {
    it('should execute a path handler', async () => {
      const res = await request(app).get('/linear/my-issues');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('app', 'linear');
      expect(res.body).toHaveProperty('path', 'my-issues');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('issues');
      expect(res.body.data).toHaveProperty('count', 1);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return 404 for unknown app', async () => {
      const res = await request(app).get('/unknown/my-issues');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for unknown path in existing app', async () => {
      const res = await request(app).get('/linear/unknown-path');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('not found');
    });
  });

  describe('Error handling', () => {
    it('should include timestamp in error responses', async () => {
      const res = await request(app).get('/unknown/path');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include statusCode in error responses', async () => {
      const res = await request(app).get('/list/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('statusCode', 404);
    });
  });
});
