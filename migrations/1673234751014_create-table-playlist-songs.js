/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.playlist.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.song.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
  // eslint-disable-next-line max-len
  // pgm.addConstraint('playlist_songs', 'unique.playlist_id.song_id', 'UNIQUE (playlist_id,song_id)'); --TBD
};

exports.down = (pgm) => {
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.song.id');
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.playlists.id');

  pgm.dropTable('playlist_songs');
};
