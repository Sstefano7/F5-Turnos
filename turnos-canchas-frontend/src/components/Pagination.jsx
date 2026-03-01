import '../styles/Pagination.css';

function Pagination({ currentPage, lastPage, onPageChange }) {
  const maxButtons = 5;
  
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(lastPage, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (lastPage <= 1) return null;

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        ← Anterior
      </button>

      {currentPage > 3 && (
        <>
          <button onClick={() => onPageChange(1)} className="pagination-btn">
            1
          </button>
          {currentPage > 4 && <span className="pagination-dots">...</span>}
        </>
      )}

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}

      {currentPage < lastPage - 2 && (
        <>
          {currentPage < lastPage - 3 && <span className="pagination-dots">...</span>}
          <button onClick={() => onPageChange(lastPage)} className="pagination-btn">
            {lastPage}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="pagination-btn"
      >
        Siguiente →
      </button>

      <span className="pagination-info">
        Página {currentPage} de {lastPage}
      </span>
    </div>
  );
}

export default Pagination;