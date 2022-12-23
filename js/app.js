console.log("Application is live");

const urlMovies = config.urlMovies;
const accessKey = config.apiKeyMovies;
const urlBin = config.urlBin;
const masterKeyBin = config.masterKeyBin;
let searchWord = "";
let page = 1;

const App = {
  listOfMovies: [],
  listOfFavorites: [],
  elements: {
    movieListContainer: document.querySelector(".movie-list"),
    searchInput: document.querySelector(".search"),
    searchType: document.querySelector(".search-type"),
  },
  fetchMovies() {
    resetMovieList();
    fetch(
      urlMovies +
        `apikey=${accessKey}&s=${searchWord}&page=${page}&type=${this.elements.searchType.value}`
    )
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        data.Search.forEach((movie) => {
          fetchDataAndCreateCard(movie);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  createFavorite(id, favoriteBtn) {
    const movie = this.listOfMovies.find((movie) => movie.imdbID == id);
    this.listOfFavorites.push(movie);
    favoriteBtn.textContent = "Remove favorite";
  },
  removeFavorite(id, favoriteBtn) {
    const movieIndex = this.listOfFavorites.findIndex(
      (movie) => movie.imdbID == id
    );
    this.listOfFavorites.splice(movieIndex, 1);
    favoriteBtn.textContent = "Add to favorites";
  },
  render() {
    // fetchTestDataAndCreateCard();
    this.fetchMovies();
  },
};

//For testing
function fetchTestDataAndCreateCard() {
  let arr = { ...localStorage };
  for (const [key, value] of Object.entries(arr)) {
    App.listOfMovies.push(JSON.parse(value));
    createCard(JSON.parse(value), false);
    console.log(JSON.parse(value));
  }
}

//For prod
function fetchDataAndCreateCard(movie) {
  const isActive = false;
  fetch(urlMovies + `apikey=${accessKey}&i=${movie.imdbID}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      App.listOfMovies.push(movie);
      createCard(data, isActive);
    })
    .catch((err) => {
      console.log(err);
    });
}

function resetMovieList() {
  App.listOfMovies = [];
  App.elements.movieListContainer.innerHTML = "";
}

function createCard(movie, isActive) {
  const card = document.createElement("div");
  card.classList.add("card");
  const id = movie.imdbID;
  card.id = id;
  let isListedFavorite = isFavorite(movie.imdbID);
  card.innerHTML = setContent(movie, isActive, isListedFavorite);
  App.elements.movieListContainer.appendChild(card);
}

function isFavorite(id) {
  if (App.listOfFavorites.find((movie) => movie.imdbID == id)) {
    return true;
  } else return false;
}

function toggleFavorite(id) {
  const card = document.getElementById(id);
  const button = card.querySelector(".favorite-btn");
  const isListedFavorite = isFavorite(id);
  if (isListedFavorite) {
    App.removeFavorite(id, button);
    card.classList.remove("favorite");
    return false;
  } else {
    App.createFavorite(id, button);
    card.classList.add("favorite");
    return true;
  }
}

function toggleCard(id) {
  const movie = App.listOfMovies.find((movie) => movie.imdbID == id);
  const element = document.getElementById(id);
  const isListedFavorite = isFavorite(movie.imdbID);
  resetActiveCards(element, isListedFavorite);
  if (element.classList.contains("active-card")) {
    element.classList.remove("active-card");
    element.innerHTML = setContent(movie, false, isListedFavorite);
  } else {
    element.classList.add("active-card");
    element.innerHTML = setContent(movie, true, isListedFavorite);
  }
  element.scrollIntoView();
}

function resetActiveCards(element, isListedFavorite) {
  document.querySelectorAll(".active-card").forEach((card) => {
    if (card !== element) {
      card.classList.remove("active-card");
      let recentMovie = App.listOfMovies.find(
        (movie) => movie.imdbID == card.id
      );
      card.innerHTML = setContent(recentMovie, false, isListedFavorite);
    }
  });
}

function setContent(movie, isActive, isListedFavorite) {
  const img =
    movie.Poster == "N/A" ? "/assets/noImgAvailable.jpg" : movie.Poster;
  const rating = movie.imdbRating ? movie.imdbRating : "-";
  const type = movie.Type ? movie.Type : "-";
  const director = movie.Director ? movie.Director : "-";
  const year = movie.Year ? movie.Year : "-";
  const runtime = movie.Runtime ? movie.Runtime : "-";
  const genre = movie.Genre ? movie.Genre : "-";
  const plot = movie.Plot ? movie.Plot : "-";
  const actors = movie.Actors ? movie.Actors : "-";

  const inactiveCard = `
    <article>
      <div class="img-container">
        <img onclick="toggleCard('${movie.imdbID}')" src="${img}"
  }">
      </div>
      <section>
        <span>
          <h4>${movie.Title}</h4>
          <h4>⭐${rating}</h4>
        </span>
        <span class="buttons-container">
          <button class="favorite-btn" onclick=toggleFavorite('${
            movie.imdbID
          }')>${
    isListedFavorite ? "Remove favorite" : "Add to watchlist"
  }</button>
          <button class="toggle-card" onclick="toggleCard('${
            movie.imdbID
          }')">About</button>
        </span>
      </section>
    </article>
  `;

  const activeCard = `
    <article>
      <div class="img-container">
        <img onclick="toggleCard('${movie.imdbID}')" src="${img}">
      </div>
      <section>
        <span>
          <h3>${movie.Title}</h3>
          <button class="favorite-btn" onclick=toggleFavorite('${
            movie.imdbID
          }')>${
    isListedFavorite ? "Remove favorite" : "Add to watchlist"
  }</button>
        </span>
        <span>
          <ul>
            <li>
              <label>Rating</label>
              <h4>⭐${rating}</h4>
            </li>
            <li>
              <label>Type</label>
              <h4>${type}</h4>
            </li>
            <li>
              <label>Director</label>
              <h4>${director}</h4>
            </li>
            <li>
              <label>Year</label>
              <h4>${year}</h4>
            </li>
            <li>
              <label>Runtime</label>
              <h4>${runtime}</h4>
            </li>
            <li>
              <label>Genre</label>
              <h4>${genre}</h4>
            </li>
          </ul>
        </span>
        <span>
          <h4>About</h4>
          <p>${plot}</p>
          <h4>Actors</h4>
          <p>${actors}</p>
        </span>
      </section>
    </article>
  `;

  if (!isActive) {
    return inactiveCard;
  }
  if (isActive) {
    return activeCard;
  }
}

function searchInit() {
  searchWord = App.elements.searchInput.value;
  if (searchWord.length > 2) {
    App.fetchMovies();
  } else {
    resetMovieList();
  }
}

//TODO
/* 
  Add functionallity to get more pages when scrolling down
*/

App.elements.searchInput.addEventListener("input", () => {
  searchInit();
});

App.elements.searchType.addEventListener("change", () => {
  searchInit();
});

App.render();
