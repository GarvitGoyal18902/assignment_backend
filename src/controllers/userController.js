const { createUser, getUserByRole } = require('../services/userService');

async function createUserHandler(req, res, next) {
    try {
        const { name, role } = req.body;

        if (!name || !role) {
            return res.status(400).json({ message: 'Name and Role are required.' });
        }

        const user = await createUser({
            name,
            role,
            isActive: true
        });

        return res.status(201).json({
            userId: user._id,
            role: user.role,
            isActive: user.isActive
        });
    } catch (err) {
        next(err);
    }
}

async function getUserByRoleHandler(req, res, next) {
    try {
        const { role } = req.params;
        const user = await getUserByRole(role);
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createUserHandler,
    getUserByRoleHandler
};
