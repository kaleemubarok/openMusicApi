/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(owner, name) {
    const id = `pl-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylistByUserId(id) {
    const query = { text: 'SELECT p.id, p.name, u.username FROM playlists p INNER JOIN users u ON u.id=p.owner LEFT JOIN collaborations c ON p.id = c.playlist_id WHERE u.id = $1 OR c.user_id = $1', values: [id] };
    const result = await this._pool.query(query);

    const playlist = result.rows;
    return playlist;
  }

  async getPlaylistById(id) {
    const query = { text: 'SELECT p.id, p.name, u.username FROM playlists p INNER JOIN users u ON u.id=p.owner WHERE p.id = $1', values: [id] };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    return playlist;
  }

  async getPlaylistSongs(id, userId) {
    const query = {
      // eslint-disable-next-line max-len
      text: 'SELECT s.id, s.title, s.performer FROM songs s INNER JOIN playlist_songs ps ON s.id = ps.song_id INNER JOIN playlists p ON p.id = ps.playlist_id LEFT JOIN collaborations c on p.id = c.playlist_id WHERE p.id = $1 AND (c.user_id = $2 OR p.owner = $2)',
      values: [id, userId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu playlist tidak ditemukan');
    }
    const playlist = result.rows;
    return playlist;
  }

  async deletePlaylistSong(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus playlist. Lagu tidak ditemukan di playlist');
    }

    return result;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus playlist. Id tidak ditemukan');
    }

    return result;
  }

  async postPlaylistSong(playlistId, songId) {
    const id = `pl-s-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  // async deleteRefreshToken(token) {
  //   const query = {
  //     text: 'DELETE FROM playlists WHERE token = $1',
  //     values: [token],
  //   };
  //   await this._pool.query(query);
  // }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Resource yang Anda minta tidak ditemukan');
    }
    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async verifySongId(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Id lagu yang ada masukkan tidak ditemukan');
    }
  }

  async addPlaylistActivities(playlistId, songId, userId, action) {
    const id = `a-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menambahkan playlist activities');
    }

    return result.rows[0].id;
  }

  async getPlaylistActivities(id) {
    const query = {
      // eslint-disable-next-line max-len
      text: 'SELECT u.username, s.title, a.action, a.time FROM users u INNER JOIN playlist_song_activities a ON u.id = a.user_id INNER JOIN songs s ON s.id = a.song_id WHERE a.playlist_id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Aktivitas playlist tidak ditemukan');
    }
    const activities = result.rows;
    return activities;
  }
}
module.exports = PlaylistsService;
