/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapAlbumDBToModel } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();

    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumByID(id) {
    let query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Id album tidak ditemukan');
    }
    const album = result.rows.map(mapAlbumDBToModel)[0];

    query = {
      text: 'SELECT s.id, title, performer FROM songs s INNER JOIN albums a on a.id=s.album_id WHERE a.id = $1',
      values: [album.id],
    };
    const songs = await this._pool.query(query);
    album.songs = songs.rows;
    return album;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async editAlbumCover(id, coverUrl) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET cover_url = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [coverUrl, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui cover album. Id tidak ditemukan');
    }
  }

  async deleteLike(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 and album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      return false;
    }
    return true;
  }

  async postLike(userId, albumId) {
    await this.getAlbumByID(albumId);

    const deleted = await this.deleteLike(userId, albumId);
    await this._cacheService.delete(`likes:${albumId}`);
    if (deleted) {
      return 'Unlike saved';
    }

    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, albumId, userId],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Like gagal ditambahkan');
    }

    return 'New like added';
  }

  async getLike(albumId) {
    try {
      // getting likes from cache
      const result = await this._cacheService.get(`likes:${albumId}`);
      console.log(`likes: ${+JSON.parse(result)}`);

      return {
        likes: +JSON.parse(result),
        isCache: true,
      };
    } catch (error) {
      // bila gagal, diteruskan dengan mendapatkan like dari database
      const query = {
        text: 'SELECT count(*) AS likes FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);
      if (!result.rows.length) {
        throw new NotFoundError('Id album tidak ditemukan');
      }
      const likes = +result.rows[0].likes;
      console.log(`likes: ${likes}`);

      // storing likes count to cache
      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(likes));
      return {
        likes,
        isCache: false,
      };
    }
  }
}

module.exports = AlbumsService;
