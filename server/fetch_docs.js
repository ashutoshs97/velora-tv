import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const titles = [
  "American Murder: Gabby Petito",
  "American Murder: Laci Peterson",
  "American Nightmare",
  "The Perfect Neighbor",
  "Amy Bradley Is Missing",
  "Athlete A",
  "Bad Influence: The Dark Side",
  "Amanda Knox",
  "American Godfathers: The Five Families",
  "Don’t F**k with Cats: Hunting an Internet Killer",
  "Night Stalker: The Hunt for a Serial Killer",
  "American Murder: The Family Next Door",
  "The Sons of Sam: A Descent into Darkness",
  "The Ripper",
  "Conversations with a Killer: The Ted Bundy Tapes",
  "The Disappearance of Madeleine McCann",
  "House of Secrets: The Burari Deaths",
  "Abducted in Plain Sight",
  "Wild Wild Country",
  "Jeffrey Epstein: Filthy Rich",
  "Worst Roommate Ever",
  "Hathras 16 Days 2026"
];

// Replaced Fk with F**k for standard TMDB matching
titles[9] = "Don't F**k with Cats: Hunting an Internet Killer";

const API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function searchTMDB(query) {
  let url = `${TMDB_BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  let res = await fetch(url);
  let data = await res.json();
  
  if (data.results && data.results.length > 0) {
    // try to find an exact or closest match that has a poster
    let match = data.results.find(m => m.poster_path) || data.results[0];
    return {
      id: match.id,
      title: match.title || match.name,
      poster_path: match.poster_path,
      backdrop_path: match.backdrop_path,
      vote_average: match.vote_average,
      release_date: match.release_date || match.first_air_date,
      media_type: match.media_type || (match.title ? 'movie' : 'tv')
    };
  }
  
  console.log('Not found:', query);
  return null;
}

async function run() {
  let results = [];
  for (let title of titles) {
    let result = await searchTMDB(title);
    if (result) results.push(result);
  }
  fs.writeFileSync('../client/src/config/crimeDocs.json', JSON.stringify(results, null, 2));
  console.log('Done, saved to client/src/config/crimeDocs.json');
}

run();
