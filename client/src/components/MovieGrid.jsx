import MovieCard from './MovieCard';

function SkeletonCard() {
  return (
    <div className="rounded-md overflow-hidden bg-prime-surface border border-transparent aspect-video p-0">
      <div className="w-full h-full skeleton" />
    </div>
  );
}

export default function MovieGrid({ movies, loading, emptyMessage = 'No movies found.' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-prime-subtext">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 animate-fade-in relative z-10 w-full mb-10">
      {movies.map((movie) => (
        <MovieCard key={movie._id || movie.id} movie={movie} />
      ))}
    </div>
  );
}
