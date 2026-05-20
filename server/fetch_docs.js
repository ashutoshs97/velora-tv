import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const titles = [
  // Original List
  "American Murder: Gabby Petito",
  "American Murder: Laci Peterson",
  "American Nightmare",
  "The Perfect Neighbor",
  "Amy Bradley Is Missing",
  "Athlete A",
  "Bad Influence: The Dark Side",
  "Amanda Knox",
  "American Godfathers: The Five Families",
  "Don't F**k with Cats: Hunting an Internet Killer",
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
  "Hathras 16 Days 2026",
  
  // New Indian True Crime Additions
  "Indian Predator: Murder in a Courtroom",
  "Crime Stories: India Detectives",
  "Delhi Crime",
  "The Indrani Mukerjea Story: The Buried Truth",
  "Indian Predator: The Butcher of Delhi",
  "Indian Predator: Beast of Bangalore",
  "Indian Predator: Diary of a Serial Killer",
  "Curry & Cyanide - The Jolly Joseph Case"
];

const API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function searchTMDB(query) {
  let url = `${TMDB_BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  let res = await fetch(url);
  let data = await res.json();
  
  if (data.results && data.results.length > 0) {
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
  // Use a Set to avoid duplicates (e.g. House of Secrets was in both lists)
  const uniqueIds = new Set();
  
  for (let title of titles) {
    let result = await searchTMDB(title);
    if (result && !uniqueIds.has(result.id)) {
      uniqueIds.add(result.id);
      results.push(result);
    }
  }
  fs.writeFileSync('../client/src/config/crimeDocs.json', JSON.stringify(results, null, 2));
  console.log('Done, saved to client/src/config/crimeDocs.json');
}

run();
