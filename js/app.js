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
    const response = await fetch(
      urlMovies +
        `apikey=${accessKey}&s=${searchWord}&page=${page}&type=${this.elements.searchType.value}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.Search) {
        data.Search.forEach((movie) => {
          fetchDataAndCreateCard(movie.imdbID);
          tempArr.push(movie);
        });
      }
      this.listOfMovies.push(tempArr);
      pushHistory();
    } else {
      console.log("Error: ", response.status);
    }
    setLoading(false);
  },
  async fetchFavorites() {
    this.listOfFavorites = [];
    resetMovieList();
    setLoading(true);
    console.log("Fetching favorites");
    const response = await fetch(config.urlBin, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        "X-Master-Key": config.masterKeyBin,
      },
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Favorites::", data);
      setLoading(false);
      if (data.record.length < 2 && Object.keys(data.record[0]).length < 1)
        throw Error("No favorites");
      data.record.forEach((movie) => {
        this.listOfFavorites.push(movie);
        if (activeNav == "favorites") fetchDataAndCreateCard(movie.imdbID);
      });
    } else {
      console.log("Error: ", response.status);
      setLoading(false);
      if (activeNav == "favorites") {
        setErrorText();
      }
    }
  },
  async fetchSearchHits() {
    setLoading(true);
    this.listOfSearchHits = [];
    const tempArr = [];
    console.log("Fetching search history");
    const response = await fetch(config.urlSearchHistoryBin, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        "X-Master-Key": config.masterKeyBin,
      },
    });
    if (response.ok) {
      setLoading(false);
      const data = await response.json();
      console.log("Records::", data);
      data.record.forEach((imdbID) => tempArr.push(imdbID));
      this.listOfSearchHits.push(...tempArr);
    } else {
      console.log("Error: ", response.status);
    }
  },
  async createFavorite(id, favoriteBtn) {
    const movie = findMovieById(id);
    addFavorite(movie);
    await pushFavorites();
    favoriteBtn.textContent = "Remove favorite";
  },
  async removeFavorite(id, favoriteBtn) {
    const movieIndex = this.listOfFavorites.findIndex(
      (movie) => movie.imdbID == id
    );
    this.listOfFavorites.splice(movieIndex, 1);
    if (this.listOfFavorites.length < 1) {
      this.listOfFavorites = [{}];
    }
    await pushFavorites();
    favoriteBtn.textContent = "Add to favorites";
  },
  render() {
    this.fetchSearchHits();
  },
};

function initSearch() {
  searchWord = App.elements.searchInput.value;
  if (App.elements.searchInput.value.length > 2) {
    resetMovieList();
    App.fetchMovies();
  } else {
    resetMovieList();
  }
}

function sortByGenreAndType(genre, type) {
  const genres = genre.split(", ");
  const genreEmpty = App.elements.searchGenre.value == "";
  const typeEmpty = App.elements.searchType.value == "";
  const genreSelected = genres.some(
    (item) => item == App.elements.searchGenre.value
  );
  const typeSelected = App.elements.searchType.value == type;
  if (genreEmpty && typeEmpty) return true;
  if (genreSelected || typeSelected) return true;
}

async function fetchDataAndCreateCard(movieImdbID) {
  const movieData = await fetchFullMovieDataById(movieImdbID);
  const isActive = false;
  const isValid = sortByGenreAndType(movieData.Genre, movieData.Type);
  if (movieData && isValid) {
    App.listOfMovies.push(movieData);
    addMovieToHistory(movieData);
    renderMovieCard(movieData, isActive);
  }
}

async function fetchFullMovieDataById(id) {
  const response = await fetch(
    urlMovies + `apikey=${accessKey}&plot=full&i=${id}`
  );
  const data = await response.json();
  return data;
}

function addFavorite(movie) {
  App.listOfFavorites.push(movie);
}

async function pushFavorites() {
  console.log("Pushing favorites");
  const response = await fetch(config.urlBin, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
      "X-Master-Key": config.masterKeyBin,
    },
    body: JSON.stringify(App.listOfFavorites),
  });
  if (response.ok) {
    console.log("Favorites::", response);
  } else {
    console.log("Error: ", response.status);
  }
}

async function pushHistory() {
  console.log("Pushing history");
  const response = await fetch(config.urlSearchHistoryBin, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
      "X-Master-Key": config.masterKeyBin,
    },
    body: JSON.stringify(App.listOfSearchHits),
  });
  if (response.ok) {
    console.log("History::", response);
  } else {
    console.log("Error: ", response.status);
  }
}

function addMovieToHistory(movie) {
  if (!movieInHistory(movie.imdbID)) {
    App.listOfSearchHits.push(movie.imdbID);
  }
}

function toggleFavorite(id) {
  const card = document.getElementById(id);
  const button = card.querySelector(".favorite-btn");
  const isListedFavorite = isFavorite(id);
  if (isListedFavorite) {
    App.removeFavorite(id, button);
    button.classList.remove("favorite");
    if (activeNav == "favorites") {
      card.classList.add("hidden");
    }
    return false;
  } else {
    App.createFavorite(id, button);
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
  document.querySelector(".search").value = "";
  searchWord = "";
  resetMovieList();
  for (let index = 0; index < 10; index++) {
    let num = getRandomNum(list.length);
    fetchDataAndCreateCard(list[num]);
  }
}

//Routes
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

//Event listeners
window.addEventListener("scroll", throttle(isScrolledBottom, 200));

App.elements.searchInput.addEventListener("input", () => {
  initSearch();
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

//Render app
App.render();
