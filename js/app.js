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
  fetchMovies() {
    setLoading(true);
    fetch(
      urlMovies +
        `apikey=${accessKey}&s=${searchWord}&page=${page}&type=${this.elements.searchType.value}`
    )
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        setLoading(false);
        data.Search.forEach((movie) => {
          fetchDataAndCreateCard(movie);
        });
      })
      .catch((err) => {
        setLoading(false);
        console.log(err);
      });
  },
  fetchFavorites() {
    this.listOfFavorites = [];
    resetMovieList();
    setLoading(true);
    fetch(config.urlBin, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        "X-Master-Key": config.masterKeyBin,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setLoading(false);
        if (data.record.length < 2 && Object.keys(data.record[0]).length < 1)
          throw Error("No favorites");
        data.record.forEach((movie) => this.listOfFavorites.push(movie));
        if (activeNav == "favorites") {
          this.listOfFavorites.forEach((movie) =>
            fetchDataAndCreateCard(movie)
          );
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        if (activeNav == "favorites") {
          setErrorText();
        }
      });
  },
  createFavorite(id, favoriteBtn) {
    const movie = this.listOfMovies.find((movie) => movie.imdbID == id);
    this.listOfFavorites.push(movie);
    pushFavorites(this.listOfFavorites);
    favoriteBtn.textContent = "Remove favorite";
  },
  removeFavorite(id, favoriteBtn) {
    const movieIndex = this.listOfFavorites.findIndex(
      (movie) => movie.imdbID == id
    );
    this.listOfFavorites.splice(movieIndex, 1);
    if (this.listOfFavorites.length < 1) {
      this.listOfFavorites = [{}];
    }
    pushFavorites(this.listOfFavorites);
    favoriteBtn.textContent = "Add to favorites";
  },
  render() {
    this.fetchFavorites();
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
  fetch(urlMovies + `apikey=${accessKey}&plot=full&i=${movie.imdbID}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (!App.elements.searchGenre.value || activeNav == "favorites") {
        App.listOfMovies.push(data);
        createCard(data, isActive);
      } else {
        let genres = data.Genre.split(", ");
        if (genres.indexOf(App.elements.searchGenre.value) !== -1) {
          App.listOfMovies.push(data);
          createCard(data, isActive);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function pushFavorites(favoritesList) {
  fetch(config.urlBin, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
      "X-Master-Key": config.masterKeyBin,
    },
    body: JSON.stringify(favoritesList),
  });
}

function createCard(movie, isActive) {
  const card = document.createElement("div");
  card.classList.add("card");
  const id = movie.imdbID;
  card.id = id;
  let isListedFavorite = isFavorite(movie.imdbID);
  card.innerHTML = setCardContent(movie, isActive, isListedFavorite);
  App.elements.movieListContainer.appendChild(card);
}

function initSearch() {
  searchWord = App.elements.searchInput.value;
  if (searchWord.length > 2) {
    resetMovieList();
    App.fetchMovies();
  } else {
    resetMovieList();
  }
}

function getMoreResults() {
  page += 1;
  App.fetchMovies();
}

function toggleFavorite(id) {
  const card = document.getElementById(id);
  const button = card.querySelector(".favorite-btn");
  const isListedFavorite = isFavorite(id);
  if (isListedFavorite) {
    App.removeFavorite(id, button);
    button.classList.remove("favorite");
    if (activeNav == "favorites") {
      console.log(card);
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

// Html contents
function setCardContent(movie, isActive) {
  const isListedFavorite = isFavorite(movie.imdbID);
  let buttonClass = isListedFavorite ? "favorite-btn favorite" : "favorite-btn";
  const img =
    movie.Poster == "N/A" ? "/assets/noImgAvailable.jpg" : movie.Poster;
  const rating = movie.imdbRating;
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
          <button class="${buttonClass}" onclick=toggleFavorite('${
    movie.imdbID
  }')>${isListedFavorite ? "Remove favorite" : "Add to favorites"}</button>
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
          <button class="${buttonClass}" onclick=toggleFavorite('${
    movie.imdbID
  }')>${isListedFavorite ? "Remove favorite" : "Add to favorites"}</button>
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

//Helpers
const throttle = (fn, delay) => {
  let time = Date.now();
  return () => {
    if (time + delay - Date.now() <= 0) {
      fn();
      time = Date.now();
    }
  };
};

function setLoading(status) {
  status
    ? App.elements.loader.classList.add("active")
    : App.elements.loader.classList.remove("active");
}

function resetMovieList() {
  page = 1;
  App.listOfMovies = [];
  App.elements.movieListContainer.innerHTML = "";
}

function resetActiveCards(element) {
  document.querySelectorAll(".active-card").forEach((card) => {
    if (card !== element) {
      card.classList.remove("active-card");
      let recentMovie = App.listOfMovies.find(
        (movie) => movie.imdbID == card.id
      );
      card.innerHTML = setCardContent(recentMovie, false);
    }
  });
}

function resetNavButtons(route) {
  App.elements.navButtons.forEach((btn) => btn.classList.remove("nav-active"));
  document.querySelector(`[name=${route}]`).classList.add("nav-active");
}

function setErrorText() {
  App.elements.movieListContainer.innerHTML =
    "<h2>You have not added any favorites, please add favorites to your list</h2>";
  App.elements.movieListContainer
    .querySelector("h2")
    .classList.add("error-text");
}

function searchBarVisible(visible) {
  visible
    ? App.elements.searchSection.classList.remove("hidden")
    : App.elements.searchSection.classList.add("hidden");
}

function isFavorite(id) {
  if (App.listOfFavorites.find((movie) => movie.imdbID == id)) {
    return true;
  } else return false;
}

function isScrolledBottom() {
  if (
    window.innerHeight + (window.scrollY + 200) >= document.body.offsetHeight &&
    searchWord.length > 2 &&
    activeNav == "movies"
  ) {
    throttle(getMoreResults(), 1000);
    console.log(page);
  }
}

//Routes
function navRoute(route) {
  resetMovieList();
  resetNavButtons(route);
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
window.addEventListener("scroll", throttle(isScrolledBottom, 100));

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
