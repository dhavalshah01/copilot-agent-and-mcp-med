const createAuthRouter = require('./auth');
const createBooksRouter = require('./books');
const createFavoritesRouter = require('./favorites');
const createRatingsRouter = require('./ratings');

function createApiRouter(deps) {
  const express = require('express');
  const router = express.Router();

  router.use('/', createAuthRouter(deps));
  router.use('/books', createBooksRouter(deps));
  router.use('/books', createRatingsRouter(deps));
  router.use('/favorites', createFavoritesRouter(deps));

  return router;
}

module.exports = createApiRouter;
