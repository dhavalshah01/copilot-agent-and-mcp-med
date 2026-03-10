import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Favorites.module.css';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleRemoveFavorite = (bookId) => {
    dispatch(removeFavorite({ token, bookId }));
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>
      {favorites.length === 0 ? (
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
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        // generated-by-copilot: display favorites with their optional comments
        <div className={styles.favGrid}>
          {favorites.map(book => (
            <div className={styles.favCard} key={book.id}>
              <div className={styles.favTitle}>{book.title}</div>
              <div className={styles.favAuthor}>by {book.author}</div>
              {book.comment && (
                <div className={styles.favComment}>
                  <span className={styles.favCommentLabel}>My note:</span> {book.comment}
                </div>
              )}
              <button className={styles.removeBtn} onClick={() => handleRemoveFavorite(book.id)}>
                Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
