// Check authentication
checkAuth();

// Global variables
let allBooks = [];
let currentFilter = 'all';
let currentRating = 0;
let searchTimeout = null;

// Load data when page opens
window.addEventListener('DOMContentLoaded', async () => {
  displayUserInfo();
  await loadStats();
  await loadBooks();
  
  // Prevent form submission on Enter key
  const bookForm = document.getElementById('bookForm');
  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBook();
    });
  }
});

// Display user info
function displayUserInfo() {
  const user = getUser();
  if (user) {
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
  }
}

// Load statistics
async function loadStats() {
  try {
    const stats = await apiRequest('/books/states');
    displayStats(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
    showStatsError();
  }
}

// Display statistics
function displayStats(stats) {
  const statsHTML = `
    <div class="stat-card want-to-read fade-in-up">
      <div class="icon">
        <i class="fas fa-bookmark"></i>
      </div>
      <h3>${stats.byStatus.WantedToRead || 0}</h3>
      <p>Want to Read</p>
    </div>

    <div class="stat-card reading fade-in-up" style="animation-delay: 0.1s;">
      <div class="icon">
        <i class="fas fa-book-reader"></i>
      </div>
      <h3>${stats.byStatus.reading || 0}</h3>
      <p>Currently Reading</p>
    </div>

    <div class="stat-card finished fade-in-up" style="animation-delay: 0.2s;">
      <div class="icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3>${stats.byStatus.finished || 0}</h3>
      <p>Finished</p>
    </div>

    <div class="stat-card total fade-in-up" style="animation-delay: 0.3s;">
      <div class="icon">
        <i class="fas fa-books"></i>
      </div>
      <h3>${stats.totalBooks || 0}</h3>
      <p>Total Books</p>
    </div>

    <div class="stat-card pages fade-in-up" style="animation-delay: 0.4s;">
      <div class="icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <h3>${formatNumber(stats.totalPagesRead || 0)}</h3>
      <p>Total Pages Read</p>
    </div>

    <div class="stat-card month fade-in-up" style="animation-delay: 0.5s;">
      <div class="icon">
        <i class="fas fa-calendar-alt"></i>
      </div>
      <h3>${stats.finishedThisMonth || 0}</h3>
      <p>Finished This Month</p>
    </div>

    <div class="stat-card year fade-in-up" style="animation-delay: 0.6s;">
      <div class="icon">
        <i class="fas fa-calendar-check"></i>
      </div>
      <h3>${stats.finishedThisYear || 0}</h3>
      <p>Finished This Year</p>
    </div>

    ${stats.averageRating > 0 ? `
    <div class="stat-card rating fade-in-up" style="animation-delay: 0.7s;">
      <div class="icon">
        <i class="fas fa-star"></i>
      </div>
      <h3>${stats.averageRating}</h3>
      <p>Average Rating</p>
    </div>
    ` : ''}
  `;
  document.getElementById('statsSection').innerHTML = statsHTML;
}

// Format large numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Show stats error
function showStatsError() {
  document.getElementById('statsSection').innerHTML = `
    <div class="stat-card fade-in-up" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <p style="color: var(--gray);">Unable to load statistics</p>
    </div>
  `;
}

// Load books
async function loadBooks(filter = '') {
  try {
    const endpoint = filter && filter !== 'all' ? `/books?status=${encodeURIComponent(filter)}` : '/books';
    const response = await apiRequest(endpoint);
    allBooks = response.books || [];
    displayBooks(allBooks);
  } catch (error) {
    console.error('Error loading books:', error);
    showEmptyState();
  }
}

// Display books
function displayBooks(books) {
  const booksGrid = document.getElementById('booksGrid');
  
  if (books.length === 0) {
    showEmptyState();
    return;
  }

  const booksHTML = books.map((book, index) => {
    const progressPercentage = book.totalPages > 0 
      ? Math.round((book.currentPage / book.totalPages) * 100) 
      : 0;
    const statusClass = getStatusClass(book.status);
    
    return `
    <div class="book-card ${statusClass} fade-in-up" style="animation-delay: ${index * 0.05}s;">
      <div class="book-header">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-author">
          <i class="fas fa-user-edit"></i> ${escapeHtml(book.author)}
        </div>
        <span class="book-category">
          <i class="fas fa-tag"></i> ${escapeHtml(book.category)}
        </span>
      </div>

      <div class="book-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="progress-text">
          <i class="fas fa-book-open"></i> ${book.currentPage || 0} / ${book.totalPages} pages (${progressPercentage}%)
        </div>
      </div>

      ${book.rating ? `
        <div class="book-rating">
          <div class="stars">
            ${getStarsHTML(book.rating)}
          </div>
        </div>
      ` : ''}

      ${book.notes ? `
        <div class="book-notes">
          <small><i class="fas fa-sticky-note"></i> ${escapeHtml(book.notes)}</small>
        </div>
      ` : ''}

      <div class="book-actions">
        <button class="btn btn-sm btn-primary" onclick="openProgressModal('${book._id}', ${book.currentPage || 0}, ${book.totalPages})">
          <i class="fas fa-tasks"></i> Update Progress
        </button>
        <button class="btn btn-sm btn-warning" onclick="openRateModal('${book._id}', ${book.rating || 0})">
          <i class="fas fa-star"></i> Rate
        </button>
        <button class="btn btn-sm btn-success" onclick="editBook('${book._id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBook('${book._id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;
  }).join('');

  booksGrid.innerHTML = booksHTML;
}

// Get status class for styling
function getStatusClass(status) {
  const statusMap = {
    'Want to read': 'want-to-read',
    'Reading': 'reading',
    'Finished': 'finished'
  };
  return statusMap[status] || 'want-to-read';
}

// Show empty state
function showEmptyState() {
  const booksGrid = document.getElementById('booksGrid');
  booksGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <i class="fas fa-book-open"></i>
      <h4>No Books Yet</h4>
      <p>Start building your digital library by adding your first book!</p>
      <button class="btn btn-primary" onclick="openAddBookModal()">
        <i class="fas fa-plus"></i> Add Your First Book
      </button>
    </div>
  `;
}

// Generate stars HTML
function getStarsHTML(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating 
      ? '<i class="fas fa-star"></i>' 
      : '<i class="far fa-star"></i>';
  }
  return stars;
}

// Filter books
function filterBooks(filter) {
  currentFilter = filter;
  
  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === filter || (filter === 'all' && btn.getAttribute('data-filter') === 'all')) {
      btn.classList.add('active');
    }
  });

  // Apply filter
  if (filter === 'all') {
    displayBooks(allBooks);
  } else {
    const filtered = allBooks.filter(book => book.status === filter);
    displayBooks(filtered);
  }
}

// Handle search input with debounce
function handleSearchInput() {
  const query = document.getElementById('searchInput').value.trim();
  
  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // If empty, show all books
  if (query.length === 0) {
    if (currentFilter === 'all') {
      displayBooks(allBooks);
    } else {
      filterBooks(currentFilter);
    }
    return;
  }
  
  // Debounce search
  searchTimeout = setTimeout(() => {
    searchBooks(query);
  }, 300);
}

// Search books
async function searchBooks(query) {
  if (!query || query.length === 0) {
    if (currentFilter === 'all') {
      displayBooks(allBooks);
    } else {
      filterBooks(currentFilter);
    }
    return;
  }

  try {
    console.log('Searching for:', query);
    const response = await apiRequest(`/books/search?q=${encodeURIComponent(query)}`);
    console.log('Search results:', response);
    displayBooks(response.books || []);
  } catch (error) {
    console.error('Error searching books:', error);
    alert('Search error: ' + (error.message || 'Failed to search books'));
    displayBooks(allBooks);
  }
}

// Open add book modal
function openAddBookModal() {
  document.getElementById('modalTitle').textContent = 'Add New Book';
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
  document.getElementById('currentPage').value = '0';
  document.getElementById('bookModal').classList.add('show');
}

// Close book modal
function closeBookModal() {
  document.getElementById('bookModal').classList.remove('show');
}

// Save book (add or edit)
async function saveBook() {
  const bookId = document.getElementById('bookId').value;
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const category = document.getElementById('category').value;
  const totalPages = parseInt(document.getElementById('totalPages').value);
  const currentPage = parseInt(document.getElementById('currentPage').value) || 0;
  const notes = document.getElementById('notes').value.trim();

  // Validation
  if (!title || !author || !category || !totalPages) {
    alert('Please fill in all required fields');
    return;
  }

  if (isNaN(totalPages) || totalPages < 1) {
    alert('Total pages must be a valid number greater than 0');
    return;
  }

  if (currentPage > totalPages) {
    alert('Current page cannot exceed total pages');
    return;
  }

  const data = {
    title,
    author,
    category,
    totalPages,
    currentPage,
    notes
  };

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    if (bookId) {
      // Update existing book
      console.log('Updating book:', bookId, data);
      await apiRequest(`/books/${bookId}`, 'PUT', data);
      console.log('Book updated successfully');
    } else {
      // Add new book
      console.log('Adding new book:', data);
      await apiRequest('/books', 'POST', data);
      console.log('Book added successfully');
    }

    closeBookModal();
    await loadBooks(currentFilter === 'all' ? '' : currentFilter);
    await loadStats();
    
  } catch (error) {
    console.error('Error saving book:', error);
    alert('Error: ' + (error.message || 'Failed to save book. Please try again.'));
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Book';
  }
}

// Edit book
async function editBook(id) {
  try {
    console.log('Loading book for edit:', id);
    const book = await apiRequest(`/books/${id}`);
    console.log('Book loaded:', book);
    
    if (!book || !book._id) {
      throw new Error('Invalid book data received');
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Book';
    document.getElementById('bookId').value = book._id;
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.author || '';
    document.getElementById('category').value = book.category || '';
    document.getElementById('totalPages').value = book.totalPages || '';
    document.getElementById('currentPage').value = book.currentPage || 0;
    document.getElementById('notes').value = book.notes || '';
    
    document.getElementById('bookModal').classList.add('show');
    console.log('Edit modal opened successfully');
  } catch (error) {
    console.error('Error loading book for edit:', error);
    alert('Error: ' + (error.message || 'Failed to load book. Please try again.'));
  }
}

// Delete book
async function deleteBook(id) {
  if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
    return;
  }

  try {
    await apiRequest(`/books/${id}`, 'DELETE');
    await loadBooks(currentFilter === 'all' ? '' : currentFilter);
    await loadStats();
  } catch (error) {
    alert('Error: ' + (error.message || 'Failed to delete book'));
  }
}

// Open progress modal
function openProgressModal(id, currentPage, totalPages) {
  document.getElementById('progressBookId').value = id;
  document.getElementById('progressPage').value = currentPage || 0;
  document.getElementById('progressTotal').textContent = totalPages;
  document.getElementById('progressPage').max = totalPages;
  document.getElementById('progressModal').classList.add('show');
}

// Close progress modal
function closeProgressModal() {
  document.getElementById('progressModal').classList.remove('show');
}

// Update progress
async function updateProgress() {
  const id = document.getElementById('progressBookId').value;
  const currentPage = parseInt(document.getElementById('progressPage').value);
  const totalPages = parseInt(document.getElementById('progressTotal').textContent);

  if (isNaN(currentPage) || currentPage < 0) {
    alert('Please enter a valid page number');
    return;
  }

  if (currentPage > totalPages) {
    alert(`Current page cannot exceed total pages (${totalPages})`);
    return;
  }

  try {
    await apiRequest(`/books/${id}/progress`, 'PATCH', { currentPage });
    closeProgressModal();
    await loadBooks(currentFilter === 'all' ? '' : currentFilter);
    await loadStats();
  } catch (error) {
    alert('Error: ' + (error.message || 'Failed to update progress'));
  }
}

// Open rate modal
function openRateModal(id, currentRating) {
  document.getElementById('rateBookId').value = id;
  document.getElementById('ratingValue').value = currentRating || 0;
  currentRating = currentRating || 0;
  
  // Reset stars
  const stars = document.querySelectorAll('#rateModal .stars i');
  stars.forEach(star => {
    const rating = parseInt(star.dataset.rating);
    star.className = rating <= currentRating ? 'fas fa-star' : 'far fa-star';
  });
  
  updateRatingText(currentRating);
  document.getElementById('rateModal').classList.add('show');
}

// Close rate modal
function closeRateModal() {
  document.getElementById('rateModal').classList.remove('show');
}

// Highlight stars on hover
function highlightStars(rating) {
  const stars = document.querySelectorAll('#rateModal .stars i');
  stars.forEach(star => {
    const starRating = parseInt(star.dataset.rating);
    star.className = starRating <= rating ? 'fas fa-star' : 'far fa-star';
  });
  updateRatingText(rating);
}

// Reset stars to current rating
function resetStars() {
  highlightStars(currentRating);
}

// Set rating
function setRating(rating) {
  document.getElementById('ratingValue').value = rating;
  currentRating = rating;
  
  const stars = document.querySelectorAll('#rateModal .stars i');
  stars.forEach(star => {
    const starRating = parseInt(star.dataset.rating);
    star.className = starRating <= rating ? 'fas fa-star' : 'far fa-star';
  });
  
  updateRatingText(rating);
}

// Update rating text
function updateRatingText(rating) {
  const texts = {
    0: 'Click a star to rate',
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  document.getElementById('ratingText').textContent = texts[rating] || texts[0];
}

// Save rating
async function saveRating() {
  const id = document.getElementById('rateBookId').value;
  const rating = parseInt(document.getElementById('ratingValue').value);

  if (!rating || rating < 1 || rating > 5) {
    alert('Please select a rating');
    return;
  }

  try {
    await apiRequest(`/books/${id}/rate`, 'PATCH', { rating });
    closeRateModal();
    await loadBooks(currentFilter === 'all' ? '' : currentFilter);
    await loadStats();
  } catch (error) {
    alert('Error: ' + (error.message || 'Failed to save rating'));
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Close modals when clicking outside
window.onclick = function(event) {
  const bookModal = document.getElementById('bookModal');
  const progressModal = document.getElementById('progressModal');
  const rateModal = document.getElementById('rateModal');
  
  if (event.target === bookModal) {
    closeBookModal();
  }
  if (event.target === progressModal) {
    closeProgressModal();
  }
  if (event.target === rateModal) {
    closeRateModal();
  }
}
