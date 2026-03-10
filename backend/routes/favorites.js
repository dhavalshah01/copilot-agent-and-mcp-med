const express = require('express');

// generated-by-copilot: normalize favorites array to [{bookId, comment}] format for backward compat
function normalizeFavorites(favorites) {
  return (favorites || []).map(f =>
    typeof f === 'string' ? { bookId: f, comment: '' } : f
  );
}

function createFavoritesRouter({ usersFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const books = readJSON(booksFile);
    const normalized = normalizeFavorites(user.favorites);
    const favorites = books
      .filter(b => normalized.some(f => f.bookId === b.id))
      .map(b => {
        const fav = normalized.find(f => f.bookId === b.id);
        return { ...b, comment: fav ? fav.comment : '' };
      });
    res.json(favorites);
  });

  router.post('/', authenticateToken, (req, res) => {
    const { bookId, comment = '' } = req.body;
    if (!bookId) return res.status(400).json({ message: 'Book ID required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.favorites = normalizeFavorites(user.favorites);
    const existing = user.favorites.find(f => f.bookId === bookId);
    if (existing) {
      existing.comment = comment;
    } else {
      user.favorites.push({ bookId, comment });
    }
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Book added to favorites' });
  });

  router.delete('/:bookId', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.favorites = normalizeFavorites(user.favorites);
    const index = user.favorites.findIndex(f => f.bookId === bookId);
    if (index !== -1) {
      user.favorites.splice(index, 1);
      writeJSON(usersFile, users);
    }
    res.status(200).json({ message: 'Book removed from favorites' });
  });

  return router;
}

module.exports = createFavoritesRouter;
