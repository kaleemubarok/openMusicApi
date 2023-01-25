/* eslint-disable camelcase */
const mapSongsDBToModel = ({
  id,
  title,
  performer,
}) => ({
  id,
  title,
  performer,
});

const mapSongDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapAlbumDBToModel = ({
  id,
  name,
  year,
  cover_url,
  songs,
}) => ({
  id,
  name,
  year,
  coverUrl: cover_url,
  songs,
});

// const mapPlaylistDBToModel = ({
//   id,
//   name,
//   username
// })

module.exports = { mapSongsDBToModel, mapSongDBToModel, mapAlbumDBToModel };
