/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // membuat table user_album_likes
  pgm.createTable('user_album_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint('user_album_likes', 'unique_user_album_likes_id', 'UNIQUE(id)');

  // eslint-disable-next-line max-len
  pgm.addConstraint('user_album_likes', 'fk_collaborations.album_id_albumss.id', 'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE');
  pgm.addConstraint('user_album_likes', 'fk_collaborations.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
// menghapus tabel collaborations
  pgm.dropTable('user_album_likes');
};
