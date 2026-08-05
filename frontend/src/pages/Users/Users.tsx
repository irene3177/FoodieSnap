import { useState, useEffect } from 'react';
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
import { UsersSkeleton } from '../../components/Skeleton/UsersSkeleton';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { useDebounce } from '../../hooks/useDebounce';
import { MdSearch, MdClose } from 'react-icons/md';
import Avatar from '../../components/Avatar';

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
      dispatch(fetchUsers({ page: currentPage, limit: 20 }));
    }
  }, [dispatch, currentPage, isSearching, debouncedSearch]);

  // Handle search
  useEffect(() => {
    if (debouncedSearch) {
      setIsSearching(true);
      dispatch(searchUsers(debouncedSearch));
    } else if (isSearching) {
      setIsSearching(false);
      dispatch(fetchUsers({ page: 1, limit: 20 }));
    }
  }, [debouncedSearch, dispatch, isSearching]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    dispatch(fetchUsers({ page: 1, limit: 20 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  if (loading && users.length === 0) {
    return <UsersSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-headline-md text-primary mb-2">Foodie Community</h1>
        <p className="text-secondary mb-4">
          Discover and connect with fellow food enthusiasts
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input px-10"
          />
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl" />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors cursor-pointer"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <MdClose className="text-xl" />
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && total > 0 && (
          <div className="text-sm text-muted mt-3">
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
        <div className="text-center py-8 px-4 bg-error rounded-xl text-error my-6">
          <p className="mb-3">{error}</p>
          <button
            className="px-5 py-2 bg-accent text-white rounded-md border-none cursor-pointer hover:bg-accent-hover transition-colors"
            onClick={() => dispatch(fetchUsers({ page: 1, limit: 20 }))}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Users List */}
      {!loading && users.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-4 bg-secondary rounded-xl cursor-pointer transition-all duration-200 border hover:bg-border hover:translate-x-1"
                onClick={() => handleUserClick(user._id)}
              >
                <Avatar src={user.avatar} username={user.username} size="xl" border />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-primary text-base">{user.username}</h4>
                    {user.isFollowing && (
                      <span className="text-xs px-2 py-0.5 bg-accent text-white rounded-full">Following</span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-sm text-secondary truncate">{user.bio.length > 60 ? `${user.bio.substring(0, 60)}...` : user.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6 flex-wrap">
              <button
                className="px-4 py-2 bg-secondary border rounded-lg cursor-pointer text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="flex gap-1.5 items-center">
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
                      className={`w-9 h-9 rounded-lg bg-secondary border cursor-pointer text-primary hover:bg-border transition-colors ${
                        pageNum === currentPage ? 'bg-accent text-white border-accent' : ''
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-muted">...</span>
                    <button
                      className="w-9 h-9 rounded-lg bg-secondary border cursor-pointer text-primary hover:bg-border transition-colors"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className="px-4 py-2 bg-secondary border rounded-lg cursor-pointer text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="text-center py-12 px-6 text-secondary">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-primary mb-2">No users found</h2>
          {searchTerm ? (
            <p>No users matching "{searchTerm}". Try a different search term.</p>
          ) : (
            <p>Be the first to join our community!</p>
          )}
        </div>
      )}

      <ScrollToTop threshold={300} behavior="smooth" />
    </div>
  );
}

export default Users;