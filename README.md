# My movie app

Fetch data from omdbapi
[omdbapi](https://www.omdbapi.com)

Save your favorites to jsonbin
[jsonbin](https://jsonbin.io)

## Setup
Create a file named config.js inside /js folder.

Add following.
const config = {
  urlMovies: "http://www.omdbapi.com/?",
  apiKeyMovies: "Your key here",
  urlBin: "https://api.jsonbin.io/v3/b/Your bin ID here",
  masterKeyBin: "Your masterkey to bin here",
};
