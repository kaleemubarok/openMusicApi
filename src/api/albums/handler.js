/* eslint-disable no-underscore-dangle */
const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(service, storageService, uploadsValidator, validator) {
    this._service = service;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;
    this._validator = validator;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIDHandler(request, h) {
    try {
      const { id } = request.params;
      const album = await this._service.getAlbumByID(id);

      const response = h.response({
        status: 'success',
        data: {
          album,
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

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const { id } = request.params;

    await this._service.editAlbumById(id, { name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });
    return response;
  }

  async postAlbumCoverHandler(request, h) {
    try {
      const { cover } = request.payload;
      const { id } = request.params;
      this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

      const fileLocation = await this._storageService.writeFile(cover, cover.hapi);
      console.log(`file uploaded to: ${fileLocation}`);

      // store cover location to DB
      this._service.editAlbumCover(id, fileLocation);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postAlbumLikesHandler(request, h) {
    try {
      const { id: albumId } = request.params;
      const userId = request.auth.credentials.id;

      const likeIt = await this._service.postLike(userId, albumId);

      const response = h.response({
        status: 'success',
        message: likeIt,
      });
      response.code(201);
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

  async getAlbumLikesHandler(request, h) {
    try {
      const { id: albumId } = request.params;
      console.log(albumId);
      const result = await this._service.getLike(albumId);

      const response = h.response({
        status: 'success',
        data: {
          likes: result.likes,
        },
      });

      if (result.isCache) {
        response.header('X-Data-Source', 'cache');
      }
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
}

module.exports = AlbumsHandler;
