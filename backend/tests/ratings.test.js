const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');
const fs = require('fs');

const ratingsFile = path.join(__dirname, '../data/test-ratings.json');
const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test_secret';
function getToken(username = 'sandra') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile,
  booksFile,
  ratingsFile,
  readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    try {
      req.user = jwt.verify(token, SECRET_KEY);
      next();
    } catch {
      return res.sendStatus(403);
    }
  },
  SECRET_KEY,
}));

beforeEach(() => {
  // Reset ratings to empty before each test
  fs.writeFileSync(ratingsFile, JSON.stringify([], null, 2));
});

describe('Ratings API', () => {
  it('GET /api/books/:id/ratings should return empty ratings for a book with no ratings', async () => {
    const res = await request(app).get('/api/books/1/ratings');
    expect(res.statusCode).toBe(200);
    expect(res.body.average).toBe(0);
    expect(res.body.count).toBe(0);
    expect(Array.isArray(res.body.ratings)).toBe(true);
    expect(res.body.ratings.length).toBe(0);
  });

  it('POST /api/books/:id/rating should require authentication', async () => {
    const res = await request(app)
      .post('/api/books/1/rating')
      .send({ rating: 4 });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/books/:id/rating should submit a rating successfully', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/submitted/);
    expect(res.body.rating).toBe(4);
  });

  it('GET /api/books/:id/ratings should return correct average after one rating', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });
    const res = await request(app).get('/api/books/1/ratings');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.average).toBe(4);
  });

  it('POST /api/books/:id/rating should update an existing rating', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3 });
    const res = await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(5);
    const ratingsRes = await request(app).get('/api/books/1/ratings');
    expect(ratingsRes.body.count).toBe(1);
    expect(ratingsRes.body.average).toBe(5);
  });

  it('POST /api/books/:id/rating should reject rating below 1', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 0 });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/books/:id/rating should reject rating above 5', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 6 });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/books/:id/rating should reject missing rating', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/books/:id/ratings should compute correct average for multiple ratings', async () => {
    const tokenSandra = getToken('sandra');
    const tokenOther = getToken('otheruser');
    await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${tokenSandra}`)
      .send({ rating: 4 });
    await request(app)
      .post('/api/books/1/rating')
      .set('Authorization', `Bearer ${tokenOther}`)
      .send({ rating: 2 });
    const res = await request(app).get('/api/books/1/ratings');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.average).toBe(3);
  });
});
