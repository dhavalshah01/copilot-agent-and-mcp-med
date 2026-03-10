
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks } from '../store/booksSlice';
import { addFavorite, fetchFavorites } from '../store/favoritesSlice';
import { fetchBookRatings, submitRating } from '../store/ratingsSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/BookList.module.css';

// generated-by-copilot: Inline star rating component
function StarRating({ bookId, currentRating, userRating, count, token, onRate }) {
  const [hovered, setHovered] = useState(0);
  const displayRating = hovered || userRating || 0;

  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className={`${styles.star} ${displayRating >= star ? styles.starFilled : ''}`}
          onClick={() => token && onRate(bookId, star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          title={token ? `Rate ${star} star${star > 1 ? 's' : ''}` : 'Login to rate'}
        >
          ★
        </button>
      ))}
      {count > 0 ? (
        <span className={styles.ratingInfo}>{currentRating.toFixed(1)} ({count})</span>
      ) : (
        <span className={styles.ratingInfo}>No ratings yet</span>
      )}
    </div>
  );
}

const BookList = () => {
  const dispatch = useAppDispatch();
  const books = useAppSelector(state => state.books.items);
  const status = useAppSelector(state => state.books.status);
  const token = useAppSelector(state => state.user.token);
  const username = useAppSelector(state => state.user.username);
  const navigate = useNavigate();
  const favorites = useAppSelector(state => state.favorites.items);
  const ratingsByBookId = useAppSelector(state => state.ratings.byBookId);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchBooks());
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  useEffect(() => {
    if (books.length > 0) {
      books.forEach(book => dispatch(fetchBookRatings(book.id)));
    }
  }, [dispatch, books]);

  const handleAddFavorite = async (bookId) => {
    if (!token) {
      navigate('/');
      return;
    }
    await dispatch(addFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  const handleRate = async (bookId, rating) => {
    await dispatch(submitRating({ token, bookId, rating }));
    dispatch(fetchBookRatings(bookId));
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load books.</div>;

  return (
    <div>
      <h2>Books</h2>
      {books.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No books available.</p>
          <p>Check back later or add a new book if you have permission.</p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {books.map(book => {
            const isFavorite = favorites.some(fav => fav.id === book.id);
            const bookRatings = ratingsByBookId[book.id] || { average: 0, count: 0, ratings: [] };
            const userRatingEntry = bookRatings.ratings.find(r => r.username === username);
            const userRating = userRatingEntry ? userRatingEntry.rating : 0;
            return (
              <div className={styles.bookCard + ' ' + styles.bookCardWithHeart} key={book.id}>
                {isFavorite && (
                  <span className={styles.favoriteHeart} title="In Favorites">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e25555" stroke="#e25555" strokeWidth="1.5">
                      <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z"/>
                    </svg>
                  </span>
                )}
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookAuthor}>by {book.author}</div>
                <StarRating
                  bookId={book.id}
                  currentRating={bookRatings.average}
                  userRating={userRating}
                  count={bookRatings.count}
                  token={token}
                  onRate={handleRate}
                />
                <button
                  className={styles.simpleBtn}
                  onClick={() => handleAddFavorite(book.id)}
                >
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookList;
