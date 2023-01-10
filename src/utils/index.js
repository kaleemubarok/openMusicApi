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
  songs,
}) => ({
  id,
  name,
  year,
  songs,
});

// const mapPlaylistDBToModel = ({
//   id,
//   name,
//   username
// })

module.exports = { mapSongsDBToModel, mapSongDBToModel, mapAlbumDBToModel };
