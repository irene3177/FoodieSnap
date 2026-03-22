import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  fetchUsers,
  searchUsers,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersTotal,
  selectUsersPages,
  selectSearchQuery,
  setPage
} from '../../store/usersSlice';
// change later
import Loader from '../../components/Loader/Loader';
import UserCard from '../../components/UserCard/UserCard';
import { useDebounce } from '../../hooks/useDebounce';
import './Users.css';

function Users() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  const total = useAppSelector(selectUsersTotal);
  const totalPages = useAppSelector(selectUsersPages);
  const currentPage = useAppSelector(state => state.users.page);
  const searchQuery = useAppSelector(selectSearchQuery);

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);

  // Load users on mount and when page changes
  useEffect(() => {
    if (!isSearching && !debouncedSearch) {
      dispatch(fetchUsers({ page: currentPage, limit: 12 }));
    }
  }, [dispatch, currentPage, isSearching, debouncedSearch]);

  // Handle search
  useEffect(() => {
    if (debouncedSearch) {
      setIsSearching(true);
      dispatch(searchUsers(debouncedSearch));
    } else if (isSearching) {
      setIsSearching(false);
      dispatch(fetchUsers({ page: 1, limit: 12 }));
    }
  }, [debouncedSearch, dispatch, isSearching]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    dispatch(fetchUsers({ page: 1, limit: 12 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="users-page">
      <div className="users-page__header">
        <h1 className="users-page__title">Foodie Community</h1>
        <p className="users-page__subtitle">
          Discover and connect with fellow food enthusiasts
        </p>

        {/* Search Bar */}
        <div className="users-page__search">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="users-page__search-input"
          />
          {searchTerm && (
            <button
              className="users-page__search-clear"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && total > 0 && (
          <div className="users-page__results-count">
            {isSearching ? (
              <>Found {total} {total === 1 ? 'user' : 'users'} matching "{searchTerm}"</>
            ) : (
              <>Total {total} members</>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="users-page__error">
          <p>{error}</p>
          <button
            onClick={() => dispatch(fetchUsers({ page: 1, limit: 12 }))}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && users.length === 0 && (
        <div className="users-page__loading">
          <Loader />
        </div>
      )}

      {/* Users grid */}
      {!loading && users.length > 0 && (
        <>
          <div className="users-page__grid">
            {users.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onClick={() => handleUserClick(user._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="users-page__pagination">
              <button
                className="users-page__pagination-prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="users-page__pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`users-page__pagination-page ${pageNum === currentPage ? 'users-page__pagination--active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span>...</span>
                    <button
                      className="users-page__pagination-page"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className="users-page__pagination-next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && !error && (
        <div className="users-page__empty">
          <div className="users-page__empty-icon">👥</div>
          <h2>No users found</h2>
          {searchTerm ? (
            <p>No users matching "{searchTerm}". Try a different search term.</p>
          ) : (
            <p>Be the first to join our community!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Users;