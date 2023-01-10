console.log("Application is live");

const urlMovies = "http://www.omdbapi.com/?";
const accessKey = "";
let activeNav = "movies";
let searchWord = "";
let page = 1;

const App = {
  listOfMovies: [],
  listOfFavorites: [],
  listOfSearchHits: [],
  elements: {
    body: document.body,
    main: document.main,
    loader: document.querySelector(".loader"),
    movieListContainer: document.querySelector(".movie-list"),
    searchSection: document.querySelector(".search-section"),
    searchInput: document.querySelector(".search"),
    searchType: document.querySelector(".search-type"),
    searchGenre: document.querySelector(".search-genre"),
    navButtons: [...document.querySelectorAll("nav button")],
  },
  async fetchMovies() {
    setLoading(true);
    const tempArr = [];
    console.log("Fetching movies");
    try {
      const response = await fetch(
        urlMovies +
          `apikey=${accessKey}&s=${searchWord}&page=${page}&type=${this.elements.searchType.value}`
      );
      if (!response.ok) {
        if (response.status == 401) {
          setErrorText(response.status);
          throw new SearchLimitExceededError(response.statusText);
        } else throw new Error(response.statusText);
      }
      const data = await response.json();
      if (data.Search) {
        data.Search.forEach((movie) => {
          fetchDataAndCreateCard(movie.imdbID);
          tempArr.push(movie);
        });
      }
      this.listOfMovies.push(tempArr);
      setLoading(false);
    } catch (err) {
      console.log("Error: ", err);
      setLoading(false);
    }
  },
  async fetchFavorites() {
    setLoading(true);
    this.listOfFavorites = [];
    resetMovieList();
    console.log("Fetching favorites");
    try {
      const response = localStorage.getItem("favorites");
      const data = await JSON.parse(response);
      console.log("Favorites::", data);
      ifFavoritesEmptyShowError(data);
      data.forEach((imdbID) => {
        // Favorites can be an empty object
        if (typeof imdbID == "string") {
          this.listOfFavorites.push(imdbID);
          if (activeNav == "favorites") {
            fetchDataAndCreateCard(imdbID);
          }
        } else {
          throw new FavoritesEmptyError();
        }
      });
      setLoading(false);
    } catch (err) {
      console.log("Error: ", err);
      setLoading(false);
      if (activeNav == "favorites") {
        setErrorText("noFavorites");
      }
      throw new Error(err);
    }
  },
  async createFavorite(id, favoriteBtn) {
    const movie = findMovieById(id);
    addFavorite(movie.imdbID);
    favoriteBtn.textContent = "Remove favorite";
    await pushFavorites();
  },
  async removeFavorite(id, favoriteBtn) {
    const movieIndex = this.listOfFavorites.findIndex((imdbID) => imdbID == id);
    this.listOfFavorites.splice(movieIndex, 1);
    if (this.listOfFavorites.length < 1) {
      this.listOfFavorites = [];
    }
    favoriteBtn.textContent = "Add to favorites";
    await pushFavorites();
  },
};

const debounceInitSearch = debounce(() => initSearch(), 300);
function initSearch() {
  searchWord = App.elements.searchInput.value;
  if (App.elements.searchInput.value.length > 2) {
    resetMovieList();
    App.fetchMovies();
  } else {
    resetMovieList();
  }
}

function validateGenreAndType(genre, type) {
  const genreEmpty = App.elements.searchGenre.value == "";
  const typeEmpty = App.elements.searchType.value == "";
  const typeSelected = App.elements.searchType.value == type;
  let genreSelected;
  try {
    genres = genre.split(", ");
    genreSelected = genres.some(
      (item) => item == App.elements.searchGenre.value
    );
  } catch {
    genreSelected = false;
  }
  if (genreEmpty && typeEmpty) return true;
  if (genreSelected && typeSelected) return true;
  if (genreSelected && typeEmpty) return true;
  if (genreEmpty && typeSelected) return true;
  else return false;
}

async function fetchDataAndCreateCard(movieImdbID) {
  try {
    const movieData = await fetchFullMovieDataById(movieImdbID);
    const isActive = false;
    const isValid = validateGenreAndType(movieData.Genre, movieData.Type);
    if (movieData && isValid) {
      App.listOfMovies.push(movieData);
      renderMovieCard(movieData, isActive);
    }
  } catch (err) {
    console.log("Error: ", err);
  }
}

function addFavorite(imdbID) {
  App.listOfFavorites.push(imdbID);
}

async function pushFavorites() {
  console.log("Pushing favorites");
  try {
    localStorage.setItem("favorites", JSON.stringify(App.listOfFavorites));
    const data = await JSON.parse(localStorage.getItem("favorites"));
    ifFavoritesEmptyShowError(data);
    console.log("Favorites::", data);
  } catch (err) {
    console.log("Error: ", err);
    throw new Error(err);
  }
}

function toggleFavorite(imdbID) {
  const card = document.getElementById(imdbID);
  const button = card.querySelector(".favorite-btn");
  const isListedFavorite = isFavorite(imdbID);
  if (isListedFavorite) {
    App.removeFavorite(imdbID, button);
    button.classList.remove("favorite");
    if (activeNav == "favorites") {
      card.classList.add("hidden");
    }
    return false;
  } else {
    App.createFavorite(imdbID, button);
    button.classList.add("favorite");
    return true;
  }
}

function toggleCard(id) {
  const movie = App.listOfMovies.find((movie) => movie.imdbID == id);
  const element = document.getElementById(id);
  resetActiveCards(element);
  if (element.classList.contains("active-card")) {
    element.classList.remove("active-card");
    element.innerHTML = setCardContent(movie, false);
  } else {
    element.classList.add("active-card");
    element.innerHTML = setCardContent(movie, true);
  }
  element.scrollIntoView();
}

function getRandomMovies() {
  let list = App.listOfSearchHits;
  let log = [];
  document.querySelector(".search").value = "";
  searchWord = "";
  resetMovieList();
  for (let index = 0; index < 10; index++) {
    let num = getRandomNum(list.length);
    fetchDataAndCreateCard(list[num]);
    log.push(list[num]);
  }
  console.log("Random movie IDs::", log);
}

function navRoute(route) {
  resetAll(route);
  activeNav = route;
  if (route == "favorites") {
    searchBarVisible(false);
    App.fetchFavorites();
  }
  if (route == "movies") {
    searchBarVisible(true);
    App.fetchMovies();
  }
}

window.addEventListener("scroll", throttle(isScrolledBottom, 50));

App.elements.searchInput.addEventListener("keydown", () => {
  debounceInitSearch(300);
});

App.elements.searchType.addEventListener("change", () => {
  initSearch();
});

App.elements.searchGenre.addEventListener("change", () => {
  initSearch();
});

App.elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navRoute(button.name);
  });
});
