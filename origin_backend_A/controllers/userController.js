const { User, Scheme, Bookmark } = require('../models');

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { age, state, occupation, language } = req.body;
    const user = await User.create({
      age,
      state,
      occupation,
      language: language || 'en',
    });

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        {
          model: Scheme,
          as: 'bookmarkedSchemes',
          through: { attributes: ['id', 'createdAt'] },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { age, state, occupation, language } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id '${id}' not found`,
      });
    }

    await user.update({
      age: age !== undefined ? age : user.age,
      state: state !== undefined ? state : user.state,
      occupation: occupation !== undefined ? occupation : user.occupation,
      language: language !== undefined ? language : user.language,
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUserById,
  updateUser,
};

