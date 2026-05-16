import express from 'express';
import {
  getSurprise,
  getTrending,
  getTrendingTv,
  getPopular,
  getPopularTv,
  getTopRated,
  getTopRatedTv,
  getOnAirTv,
  getNewReleases,
  searchMovies,
  getByGenre,
  getByMood,
  getTvDetails,
  getTvSeason,
  getPerson,
  getSimilar,
  getRecommendations,
  getMovieDetails
} from '../controllers/movies.controller.js';

const router = express.Router();

router.get('/surprise', getSurprise);
router.get('/trending', getTrending);
router.get('/trending-tv', getTrendingTv);
router.get('/popular', getPopular);
router.get('/popular-tv', getPopularTv);
router.get('/top-rated', getTopRated);
router.get('/top-rated-tv', getTopRatedTv);
router.get('/on-air-tv', getOnAirTv);
router.get('/new-releases', getNewReleases);
router.get('/search', searchMovies);
router.get('/genre/:id', getByGenre);
router.get('/mood/:mood', getByMood);

router.get('/tv/:id', getTvDetails);
router.get('/tv/:id/season/:seasonNumber', getTvSeason);
router.get('/person/:id', getPerson);

// wildcard routes must be last
router.get('/:id/similar', getSimilar);
router.get('/:id/recommendations', getRecommendations);
router.get('/:id', getMovieDetails);

export default router;
