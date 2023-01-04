class FavoritesEmptyError extends Error {
  constructor(message) {
    super(message);
    this.name = "FavoritesEmptyError";
  }
}

class SearchLimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = "SearchLimitExceededError";
  }
}
