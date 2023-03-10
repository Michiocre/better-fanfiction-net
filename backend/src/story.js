const Author = require('./author');

module.exports = class Story {
    constructor(id, title, author, description, img, published, updated, recorded) {
      this.id = id;
      this.title = title;
      this.author = author;
      this.description = description;
      this.img = img;
      this.published = published;
      this.updated = updated;
      this.recorded = recorded;
    }
}