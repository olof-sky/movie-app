const urlMovies = config.urlMovies;
const accessKey = config.apiKeyMovies;
const urlBin = config.urlBin;
const masterKeyBin = config.masterKeyBin;
const movieListContainer = document.querySelector(".movie-list");

console.log("Application is live");

const App = {
  listOfMovies: [],
  listOfFavorites: [],
  elements: {},
  fetchMovies() {
    fetch(urlMovies + `apikey=${accessKey}&s=The simpsons`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        data.Search.forEach((movie) => {
          fetchAndCreateCard(movie);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  createFavorite() {},
  removeFavorite() {},
  render() {
    // this.fetchMovies();
    fetchTestData();
  },
};

function fetchTestData() {
  let arr = { ...localStorage };
  for (const [key, value] of Object.entries(arr)) {
    App.listOfMovies.push(JSON.parse(value));
    createCard(JSON.parse(value));
  }
  console.log(App.listOfMovies);
}

function fetchAndCreateCard(movie) {
  fetch(urlMovies + `apikey=${accessKey}&i=${movie.imdbID}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // localStorage.setItem(movie.imdbID, JSON.stringify(data));
      createCard(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

function createCard(movie) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.id = movie.imdbID;
  card.innerHTML = toggleActiveContent(movie, false);
  movieListContainer.appendChild(card);
}

function toggleCard(id) {
  const movie = App.listOfMovies.find((movie) => movie.imdbID == id);
  const element = document.getElementById(id);
  resetActiveCards(element);
  if (element.classList.contains("active-card")) {
    element.classList.remove("active-card");
    element.innerHTML = toggleActiveContent(movie, false);
  } else {
    element.classList.add("active-card");
    element.innerHTML = toggleActiveContent(movie, true);
  }
  element.scrollIntoView();
}

function resetActiveCards(element) {
  document.querySelectorAll(".active-card").forEach((card) => {
    if (card !== element) {
      card.classList.remove("active-card");
      let recentMovie = App.listOfMovies.find(
        (movie) => movie.imdbID == card.id
      );
      card.innerHTML = toggleActiveContent(recentMovie, false);
    }
  });
}

function toggleActiveContent(movie, cardActive) {
  if (!cardActive) {
    return `
      <article>
        <div class="img-container">
          <img onclick="toggleCard('${movie.imdbID}')" src="${movie.Poster}">
        </div>
        <section>
          <span>
            <h4>${movie.Title}</h4>
            <h4>⭐${movie.imdbRating}</h4>
          </span>
          <span class="buttons-container">
            <button>Add to watchlist</button>
           <button class="toggle-card" onclick="toggleCard('${movie.imdbID}')">About</button>
          </span>
        </section>
      </article>
    `;
  }
  if (cardActive) {
    return `
      <article>
        <div class="img-container">
          <img onclick="toggleCard('${movie.imdbID}')" src="${movie.Poster}">
        </div>
        <section>
          <span>
            <h3>${movie.Title}</h3>
            <button>Add to watchlist</button>
          </span>
          <span>
            <ul>
              <li>
                <label>Rating</label>
                <h4>⭐${movie.imdbRating}</h4>
              </li>
              <li>
                <label>Type</label>
                <h4>${movie.Type}</h4>
              </li>
              <li>
                <label>Director</label>
                <h4>${movie.Director}</h4>
              </li>
              <li>
                <label>Year</label>
                <h4>${movie.Year}</h4>
              </li>
              <li>
                <label>Runtime</label>
                <h4>${movie.Runtime}</h4>
              </li>
              <li>
                <label>Genre</label>
                <h4>${movie.Genre}</h4>
              </li>
            </ul>
          </span>
          <span>
            <h4>About</h4>
            <p>${movie.Plot}</p>
            <h4>Actors</h4>
            <p>${movie.Actors}</p>
          </span>
        </section>
      </article>
    `;
  }
}

App.render();
