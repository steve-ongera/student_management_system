// frontend/src/pages/Library/BooksList.jsx
import React, { useState, useEffect } from 'react';
import { libraryAPI } from '../../services/api';
import { debounce } from '../../services/apiHelper';
import BookForm from './BookForm';

const BooksList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await libraryAPI.getBooks({
        search: searchTerm,
        page: currentPage,
        category: category || undefined
      });
      setBooks(response.data.books);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(() => {
    setCurrentPage(1);
    fetchBooks();
  }, 500);

  useEffect(() => {
    fetchBooks();
  }, [currentPage, category]);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await libraryAPI.deleteBook(id);
        fetchBooks();
      } catch (error) {
        console.error('Failed to delete book:', error);
      }
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBook(null);
    fetchBooks();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Books Management</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Add New Book
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <i className="bi-search"></i>
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <select 
          className="form-input" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Fiction">Fiction</option>
          <option value="Non-Fiction">Non-Fiction</option>
          <option value="Science">Science</option>
          <option value="Mathematics">Mathematics</option>
          <option value="History">History</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="bi-hourglass-split"></i>
          <p>Loading books...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Copies</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.id}</td>
                    <td>
                      <strong>{book.title}</strong>
                      {book.description && (
                        <div className="book-description">{book.description.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td>{book.author}</td>
                    <td>{book.isbn}</td>
                    <td>{book.category}</td>
                    <td>{book.total_copies}</td>
                    <td>{book.available_copies}</td>
                    <td>
                      <span className={`badge badge-${book.available_copies > 0 ? 'success' : 'danger'}`}>
                        {book.available_copies > 0 ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleEdit(book)}>
                        <i className="bi-pencil"></i>
                      </button>
                      <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(book.id)}>
                        <i className="bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                className="btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <BookForm book={editingBook} onClose={handleFormClose} />
      )}
    </div>
  );
};

export default BooksList;