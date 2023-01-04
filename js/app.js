console.log("Application is live");

const urlMovies = config.urlMovies;
const accessKey = config.apiKeyMovies;
const urlBin = config.urlBin;
const masterKeyBin = config.masterKeyBin;
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
    try {
      const response = await fetch(
        urlMovies +
          `apikey=${accessKey}&s=${searchWord}&page=${page}&type=${this.elements.searchType.value}`
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      if (data.Search) {
        data.Search.forEach((movie) => {
          fetchDataAndCreateCard(movie.imdbID);
          tempArr.push(movie);
        });
      }
      this.listOfMovies.push(tempArr);
      pushHistory();
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
      const response = await fetch(config.urlBin, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          "X-Master-Key": config.masterKeyBin,
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      console.log("Favorites::", data);
      ifFavoritesEmptyShowError(data);
      data.record.forEach((imdbID) => {
        // Favorites can be an empty object
        if (typeof imdbID == "string") {
          this.listOfFavorites.push(imdbID);
          if (activeNav == "favorites") {
            fetchDataAndCreateCard(imdbID);
          }
        }
      });
      setLoading(false);
    } catch (err) {
      console.log("Error: ", err);
      setLoading(false);
      if (activeNav == "favorites") {
        setErrorText();
      }
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
      this.listOfFavorites = [{}];
    }
    favoriteBtn.textContent = "Add to favorites";
    await pushFavorites();
  },
  async fetchSearchHits() {
    setLoading(true);
    this.listOfSearchHits = [];
    const tempArr = [];
    console.log("Fetching search history");
    try {
      const response = await fetch(config.urlSearchHistoryBin, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          "X-Master-Key": config.masterKeyBin,
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      setLoading(false);
      const data = await response.json();
      console.log("Records::", data);
      data.record.forEach((imdbID) => {
        if (imdbID !== "undefined" || imdbID) {
          tempArr.push(imdbID);
        }
      });
      this.listOfSearchHits.push(...tempArr);
    } catch (err) {
      console.log("Error: ", err);
    }
  },
  render() {
    this.fetchSearchHits();
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
      addMovieToHistory(movieData);
      renderMovieCard(movieData, isActive);
    }
  } catch (err) {
    console.log("Error: ", err);
  }
}

async function fetchFullMovieDataById(id) {
  try {
    const response = await fetch(
      urlMovies + `apikey=${accessKey}&plot=full&i=${id}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(config.urlBin, {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
        "X-Master-Key": config.masterKeyBin,
      },
      body: JSON.stringify(App.listOfFavorites),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    ifFavoritesEmptyShowError(data);
    console.log("Favorites::", data);
  } catch (err) {
    console.log("Error: ", err);
  }
}

async function pushHistory() {
  console.log("Pushing history");
  try {
    const response = await fetch(config.urlSearchHistoryBin, {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
        "X-Master-Key": config.masterKeyBin,
      },
      body: JSON.stringify(App.listOfSearchHits),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    console.log("History::", data);
  } catch (err) {
    console.log("Error: ", err);
  }
}

function addMovieToHistory(movie) {
  if (!movieInHistory(movie.imdbID)) {
    App.listOfSearchHits.push(movie.imdbID);
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
  resetMovieList();
  resetNavButtons(route);
  resetSelectors();
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

App.elements.searchInput.addEventListener("input", () => {
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

App.render();
