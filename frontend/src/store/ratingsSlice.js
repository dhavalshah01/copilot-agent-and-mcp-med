import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBookRatings = createAsyncThunk('ratings/fetchBookRatings', async (bookId) => {
  const res = await fetch(`http://localhost:4000/api/books/${bookId}/ratings`);
  if (!res.ok) throw new Error(`Failed to fetch ratings for book ${bookId}`);
  const data = await res.json();
  return { bookId, ...data };
});

export const submitRating = createAsyncThunk('ratings/submitRating', async ({ token, bookId, rating }) => {
  const res = await fetch(`http://localhost:4000/api/books/${bookId}/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error('Failed to submit rating');
  return { bookId, rating };
});

const ratingsSlice = createSlice({
  name: 'ratings',
  initialState: { byBookId: {}, status: 'idle' },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchBookRatings.fulfilled, (state, action) => {
        const { bookId, average, count, ratings } = action.payload;
        state.byBookId[bookId] = { average, count, ratings };
      })
      .addCase(submitRating.fulfilled, (state, action) => {
        // Ratings will be refreshed via fetchBookRatings after submission
      });
  },
});

export default ratingsSlice.reducer;
