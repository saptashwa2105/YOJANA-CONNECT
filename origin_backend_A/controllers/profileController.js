const { User, Bookmark, Scheme } = require('../models');
const { resolveUser } = require('../utils/userResolver');

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await resolveUser(req);

    // Fetch user's bookmarks
    const bookmarks = await Bookmark.findAll({
      where: { userId: user.id },
      attributes: ['id', 'schemeId', 'createdAt'],
      include: [
        {
          model: Scheme,
          as: 'scheme',
          attributes: ['id', 'name', 'category'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        age: user.age,
        state: user.state,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        language: user.language,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        bookmarkedSchemeIds: bookmarks.map((b) => b.schemeId),
        bookmarkCount: bookmarks.length,
        bookmarks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const { age, state, occupation, language, annualIncome } = req.body;

    // Validate age if provided
    if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a valid number between 0 and 120',
      });
    }

    // Validate annualIncome if provided
    let parsedIncome = user.annualIncome;
    if (annualIncome !== undefined && annualIncome !== null) {
      const num = Number(annualIncome);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: 'annualIncome must be a non-negative number',
        });
      }
      parsedIncome = num;
    }

    await user.update({
      age: age !== undefined ? age : user.age,
      state: state !== undefined ? state : user.state,
      occupation: occupation !== undefined ? occupation : user.occupation,
      language: language !== undefined ? language : user.language,
      annualIncome: parsedIncome,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        age: user.age,
        state: user.state,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        language: user.language,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

