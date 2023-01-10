/* eslint-disable no-underscore-dangle */
const ClientError = require('../../exceptions/ClientError');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  // PostPlaylistPayloadSchema,
  // PostPlaylistSongPayloadSchema,

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayloadSchema(request.payload);
    const { id: ownerId } = request.auth.credentials;
    const { name } = request.payload;

    const playlistId = await this._service.addPlaylist(ownerId, name);

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistHandler(request, h) {
    try {
      const { id } = request.auth.credentials;
      const playlists = await this._service.getPlaylistByUserId(id);

      const response = h.response({
        status: 'success',
        data: {
          playlists,
        },
      });
      return response;
    } catch (e) {
      if (e instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: e.message,
        });
        response.code(e.statusCode);
        return response;
      }
      return h.response;
    }
  }

  async postPlaylistSongHandler(request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    await this._service.verifySongId(songId);

    const { id: userId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(id, userId);
    await this._service.postPlaylistSong(id, songId);

    await this._service.addPlaylistActivities(id, songId, userId, 'add');

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: ownerId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, ownerId);
    await this._service.deletePlaylistById(id);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
    return response;
  }

  async getPlaylistActivitiesHandler(request, h) {
    try {
      const { id: playlistId } = request.params;
      const { id: userId } = request.auth.credentials;

      await this._service.verifyPlaylistAccess(playlistId, userId);
      // const playlist = await this._service.getPlaylistById(playlistId);
      const activities = await this._service.getPlaylistActivities(playlistId);

      const response = h.response({
        status: 'success',
        data: {
          playlistId,
          activities,
        },
      });
      return response;
    } catch (e) {
      if (e instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: e.message,
        });
        response.code(e.statusCode);
        return response;
      }
      return h.response;
    }
  }

  async getPlaylistSongHandler(request, h) {
    try {
      const { id } = request.params;
      const { id: userId } = request.auth.credentials;

      await this._service.verifyPlaylistAccess(id, userId);
      const playlist = await this._service.getPlaylistById(id);
      const songs = await this._service.getPlaylistSongs(id, userId);

      const response = h.response({
        status: 'success',
        data: {
          playlist: {
            id: playlist.id,
            name: playlist.name,
            username: playlist.username,
            songs,
          },
        },
      });
      return response;
    } catch (e) {
      if (e instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: e.message,
        });
        response.code(e.statusCode);
        return response;
      }
      return h.response;
    }
  }

  async deletePlaylistSongHandler(request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload);
    const { songId } = request.payload;

    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, userId);
    await this._service.deletePlaylistSong(playlistId, songId);

    await this._service.addPlaylistActivities(playlistId, songId, userId, 'delete');

    const response = h.response({
      status: 'success',
      message: 'Lagu playlist berhasil dihapus',
    });
    return response;
  }
}

module.exports = PlaylistsHandler;
