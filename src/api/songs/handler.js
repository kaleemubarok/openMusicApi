/* eslint-disable no-underscore-dangle */
const ClientError = require('../../exceptions/ClientError');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);

    const {
      title, year, genre, performer, duration, albumId,
    } = request.payload;

    const songId = await this._service.addSong({
      title, year, genre, performer, duration, albumId,
    });

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;
    const songs = await this._service.getSongs(title, performer);
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIDHandler(request, h) {
    try {
      const { id } = request.params;
      const song = await this._service.getSongByID(id);

      const response = h.response({
        status: 'success',
        data: {
          song,
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

  async putSongByIdHandler(request, h) {
    this._validator.validateSongPayload(request.payload);

    const {
      title, year, genre, performer, duration, albumId,
    } = request.payload;
    const { id } = request.params;

    await this._service.editSongById(id, {
      title, year, genre, performer, duration, albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    });
    return response;
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteSongById(id);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus',
    });
    return response;
  }
}

module.exports = SongsHandler;
