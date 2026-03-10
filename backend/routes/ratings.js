const express = require('express');

function createRatingsRouter({ ratingsFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  // GET /api/books/:id/ratings - Get ratings summary for a book
  router.get('/:id/ratings', (req, res) => {
    const { id } = req.params;
    const ratings = readJSON(ratingsFile);
    const bookRatings = ratings.filter(r => r.bookId === id);
    const count = bookRatings.length;
    const average = count > 0
      ? Math.round(bookRatings.reduce((sum, r) => sum + r.rating, 0) / count * 10) / 10
      : 0;
    res.json({ average, count, ratings: bookRatings });
  });

  // POST /api/books/:id/rating - Submit or update a rating (requires auth)
  router.post('/:id/rating', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    const ratings = readJSON(ratingsFile);
    const existing = ratings.find(r => r.bookId === id && r.username === req.user.username);
    if (existing) {
      existing.rating = ratingValue;
    } else {
      ratings.push({ bookId: id, username: req.user.username, rating: ratingValue });
    }
    writeJSON(ratingsFile, ratings);
    res.status(200).json({ message: 'Rating submitted', rating: ratingValue });
  });

  return router;
}

module.exports = createRatingsRouter;
