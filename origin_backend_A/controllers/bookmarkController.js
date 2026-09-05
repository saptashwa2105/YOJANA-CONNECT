const { Bookmark, Scheme, User } = require('../models');
const { resolveUser } = require('../utils/userResolver');
const { resolveCanonicalSchemeId } = require('../utils/schemeIdHelper');

// POST /api/bookmarks/:schemeId or POST /api/bookmarks with body
const addBookmark = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const rawSchemeId = req.params?.schemeId || req.body?.schemeId;

    if (!rawSchemeId) {
      return res.status(400).json({
        success: false,
        message: 'schemeId is required either as URL parameter or in request body',
      });
    }

    const resolvedId = resolveCanonicalSchemeId(rawSchemeId);

    // Verify scheme exists (try resolved canonical, fallback to raw)
    let scheme = await Scheme.findByPk(resolvedId);
    if (!scheme && resolvedId !== rawSchemeId) {
      scheme = await Scheme.findByPk(rawSchemeId);
    }

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: `Scheme with id '${rawSchemeId}' not found`,
      });
    }

    const canonicalSchemeId = scheme.id;

    // Check if already bookmarked
    const existing = await Bookmark.findOne({
      where: { userId: user.id, schemeId: canonicalSchemeId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Scheme '${canonicalSchemeId}' is already bookmarked by user #${user.id}`,
        data: existing,
      });
    }

    const bookmark = await Bookmark.create({
      userId: user.id,
      schemeId: canonicalSchemeId,
    });

    return res.status(201).json({
      success: true,
      message: `Scheme '${canonicalSchemeId}' bookmarked successfully`,
      data: {
        id: bookmark.id,
        userId: bookmark.userId,
        schemeId: bookmark.schemeId,
        createdAt: bookmark.createdAt,
        scheme,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const user = await resolveUser(req);

    const bookmarks = await Bookmark.findAll({
      where: { userId: user.id },
      include: [
        { model: Scheme, as: 'scheme' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      userId: user.id,
      count: bookmarks.length,
      data: bookmarks,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookmarks/:schemeId
const deleteBookmark = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const rawSchemeId = req.params?.schemeId || req.body?.schemeId;

    if (!rawSchemeId) {
      return res.status(400).json({
        success: false,
        message: 'schemeId or bookmark id parameter is required',
      });
    }

    const canonicalSchemeId = resolveCanonicalSchemeId(rawSchemeId);

    // Attempt to match by canonical schemeId first for this user
    let bookmark = await Bookmark.findOne({
      where: {
        userId: user.id,
        schemeId: canonicalSchemeId,
      },
    });

    // Fallback: check if stored under rawSchemeId (e.g. legacy bookmarks)
    if (!bookmark && canonicalSchemeId !== rawSchemeId) {
      bookmark = await Bookmark.findOne({
        where: {
          userId: user.id,
          schemeId: rawSchemeId,
        },
      });
    }

    // Fallback: check if the param was actually the integer bookmark ID
    if (!bookmark && !isNaN(Number(rawSchemeId))) {
      bookmark = await Bookmark.findOne({
        where: {
          id: Number(rawSchemeId),
          userId: user.id,
        },
      });
    }

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: `Bookmark for scheme '${rawSchemeId}' not found for user #${user.id}`,
      });
    }

    await bookmark.destroy();

    return res.status(200).json({
      success: true,
      message: `Bookmark for '${rawSchemeId}' removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBookmark,
  getBookmarks,
  deleteBookmark,
};
