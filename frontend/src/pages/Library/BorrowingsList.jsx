// frontend/src/pages/Library/BorrowingsList.jsx
import React, { useState, useEffect } from 'react';
import { libraryAPI } from '../../services/api';

const BorrowingsList = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchBorrowings();
    fetchStudents();
    fetchBooks();
  }, []);

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const response = await libraryAPI.getBorrowings();
      setBorrowings(response.data);
    } catch (error) {
      console.error('Failed to fetch borrowings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Assuming you have a students API
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await libraryAPI.getBooks({ available: true });
      setBooks(response.data.books);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    try {
      await libraryAPI.createBorrowing({
        student_id: selectedStudent,
        book_id: selectedBook,
        due_date: dueDate
      });
      setShowForm(false);
      fetchBorrowings();
      setSelectedStudent('');
      setSelectedBook('');
      setDueDate('');
    } catch (error) {
      console.error('Failed to create borrowing:', error);
    }
  };

  const handleReturn = async (borrowingId) => {
    if (window.confirm('Confirm book return?')) {
      try {
        await libraryAPI.returnBook(borrowingId);
        fetchBorrowings();
      } catch (error) {
        console.error('Failed to return book:', error);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Book Borrowings</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            New Borrowing
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading borrowings...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Book Title</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowings.map((borrowing) => (
                <tr key={borrowing.id}>
                  <td>{borrowing.id}</td>
                  <td>{borrowing.student_name}</td>
                  <td>{borrowing.book_title}</td>
                  <td>{new Date(borrowing.borrow_date).toLocaleDateString()}</td>
                  <td className={new Date(borrowing.due_date) < new Date() && !borrowing.return_date ? 'text-danger' : ''}>
                    {new Date(borrowing.due_date).toLocaleDateString()}
                  </td>
                  <td>{borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString() : '-'}</td>
                  <td>
                    {borrowing.return_date ? (
                      <span className="badge badge-success">Returned</span>
                    ) : new Date(borrowing.due_date) < new Date() ? (
                      <span className="badge badge-danger">Overdue</span>
                    ) : (
                      <span className="badge badge-warning">Borrowed</span>
                    )}
                  </td>
                  <td>
                    {!borrowing.return_date && (
                      <button 
                        className="btn-icon btn-icon-success" 
                        onClick={() => handleReturn(borrowing.id)}
                      >
                        <i className="bi-arrow-return-left"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Book Borrowing</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleBorrow}>
              <div className="form-group">
                <label className="form-label">Select Student *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.admission_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Book *</label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Choose a book...</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.author} (Available: {book.available_copies})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-input"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Issue Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingsList;