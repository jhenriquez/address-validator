import request from 'supertest';
import app from '../../src/app';

describe('Address Route Tests', () => {
  describe('POST /api/v1/address/validate', () => {
    const routePath = '/api/v1/address/validate';
    it('should return 400 when address attribute is not provided', async () => {
      const response = await request(app)
        .post(routePath)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).not.toBeUndefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(response.body.errors)).toEqual(
        expect.stringMatching(/address.*required/i)
      );
    });

    it('should return 400 when address is not a string', async () => {
      const response = await request(app)
        .post(routePath)
        .send({ address: 123 });

      expect(response.status).toBe(400);
      expect(response.body.errors).not.toBeUndefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(response.body.errors)).toEqual(
        expect.stringMatching(/address.*string/i)
      );
    });

    it('should return 400 when address is an empty string', async () => {
      const response = await request(app)
        .post(routePath)
        .send({ address: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).not.toBeUndefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(response.body.errors)).toEqual(
        expect.stringMatching(/address.*empty/i)
      );
    });
  });
});
