const throttle = (fn, delay) => {
  let time = Date.now();
  return () => {
    if (time + delay - Date.now() <= 0) {
      fn();
      time = Date.now();
    }
  };
};

function debounce(func, timeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const debounceGetMoreResults = debounce(() => getMoreResults(), 300);
function getMoreResults() {
  page += 1;
  App.fetchMovies();
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

function findMovieById(id) {
  return App.listOfMovies.find((movie) => movie.imdbID == id);
}

function renderMovieCard(movie, isActive) {
  const card = document.createElement("div");
  const id = movie.imdbID;
  card.classList.add("card");
  card.id = id;
  card.innerHTML = setCardContent(movie, isActive);
  App.elements.movieListContainer.appendChild(card);
}

function setLoading(status) {
  status
    ? App.elements.loader.classList.add("active")
    : App.elements.loader.classList.remove("active");
}

function setErrorText(error) {
  let text;
  if (error == "noFavorites") {
    text =
      "You have not added any favorites, please add favorites to your list";
  }
  if (error == 401) {
    document.querySelector(".search-section").classList.add("hidden");
    text = "Your search limit for today is reached, please come back tomorrow";
  }
  App.elements.movieListContainer.innerHTML = `<h2>${text}</h2>`;
  App.elements.movieListContainer
    .querySelector("h2")
    .classList.add("error-text");
}

function resetAll(route) {
  resetMovieList();
  resetNavButtons(route);
  resetSelectors();
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

function resetSelectors() {
  App.elements.searchGenre.value = "";
  App.elements.searchType.value = "";
  App.elements.searchInput.value = "";
}

function searchBarVisible(visible) {
  visible
    ? App.elements.searchSection.classList.remove("hidden")
    : App.elements.searchSection.classList.add("hidden");
}

function isFavorite(id) {
  if (App.listOfFavorites.find((imdbID) => imdbID == id)) {
    return true;
  } else return false;
}

function ifFavoritesEmptyShowError(data) {
  if (data.length < 2 && Object.keys(data[0]).length < 1) {
    if (activeNav == "favorites") {
      setErrorText("noFavorites");
      throw new FavoritesEmptyError();
    }
  }
}

function isScrolledBottom() {
  if (
    window.innerHeight + (window.scrollY + 200) >= document.body.offsetHeight &&
    searchWord.length > 2 &&
    activeNav == "movies"
  ) {
    debounceGetMoreResults(500);
    console.log("Search page: " + page);
  }
}

function getRandomNum(roof) {
  return Math.floor(Math.random() * (roof - 1));
}
