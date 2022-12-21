const urlMovies = config.urlMovies;
const accessKey = config.apiKeyMovies;
const urlBin = config.urlBin;
const masterKeyBin = config.masterKeyBin;
console.log("Application is live");

const App = {
  listOfMovies: [],
  listOfFavorites: [],
  elements: {},
  fetchMovies() {
    fetch(urlMovies + `apikey=${accessKey}&s=batman`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        data.Search.forEach((movie) => this.listOfMovies.push(movie));
      })
      .catch((err) => {
        console.log(err);
      });
  },
  createFavorite() {},
  removeFavorite() {},
  render() {
    this.fetchMovies();
  },
};
App.render();
