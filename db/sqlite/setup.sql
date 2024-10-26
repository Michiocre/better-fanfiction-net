-- SQLite
CREATE TABLE IF NOT EXISTS author (
    id INTEGER NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS fandom (
    id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS character (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fandom_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (fandom_id) REFERENCES fandom(id),
    UNIQUE (fandom_id, name)
);

CREATE TABLE IF NOT EXISTS story (
    id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    fandom_id INTEGER NOT NULL,
    xfandom_id INTEGER,
    rating TEXT NOT NULL,
    chapters INTEGER NOT NULL,
    words INTEGER NOT NULL,
    reviews INTEGER DEFAULT NULL,
    favs INTEGER DEFAULT NULL,
    follows INTEGER DEFAULT NULL,
    updated INTEGER DEFAULT NULL,
    published INTEGER NOT NULL,
    completed INTEGER NOT NULL,
    genreA TEXT,
    genreB TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES author(id),
    FOREIGN KEY (fandom_id) REFERENCES fandom(id),
    FOREIGN KEY (xfandom_id) REFERENCES fandom(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS story_texts USING fts5(id UNINDEXED, title, description);

CREATE TABLE IF NOT EXISTS story_fandom (
    story_id INTEGER NOT NULL,
    fandom_id INTEGER NOT NULL,
    PRIMARY KEY (story_id, fandom_id),
    FOREIGN KEY (story_id) REFERENCES story(id),
    FOREIGN KEY (fandom_id) REFERENCES fandom(id)
);

CREATE TABLE IF NOT EXISTS story_character (
    story_id INTEGER NOT NULL,
    character_id INTEGER NOT NULL,
    pairing INTEGER DEFAULT(0) NOT NULL,
    PRIMARY KEY (story_id, character_id, pairing),
    FOREIGN KEY (story_id) REFERENCES story(id),
    FOREIGN KEY (character_id) REFERENCES character(id)
);

CREATE TABLE IF NOT EXISTS community (
    id INTEGER NOT NULL,
    name TEXT NOT NULL,
    founder_id INTEGER NOT NULL,
    focus_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    story_count INTEGER NOT NULL,
    followers INTEGER NOT NULL,
    description TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (founder_id) REFERENCES author(id),
    FOREIGN KEY (focus_id) REFERENCES fandom(id)
);

CREATE TABLE IF NOT EXISTS story_community (
    story_id INTEGER NOT NULL,
    community_id INTEGER NOT NULL,
    PRIMARY KEY (story_id, community_id),
    FOREIGN KEY (story_id) REFERENCES story(id),
    FOREIGN KEY (community_id) REFERENCES community(id)
);

CREATE TABLE IF NOT EXISTS community_author (
    community_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    PRIMARY KEY (community_id, author_id),
    FOREIGN KEY (community_id) REFERENCES community(id),
    FOREIGN KEY (author_id) REFERENCES author(id)
);

CREATE TABLE IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tag_group TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_tag (
    story_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (story_id, tag_id),
    FOREIGN KEY (story_id) REFERENCES story(id),
    FOREIGN KEY (tag_id) REFERENCES tag(id)    
);


INSERT OR IGNORE INTO fandom VALUES (0, 'All Categories', 'general');