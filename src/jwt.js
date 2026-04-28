const jwt = require('jsonwebtoken');

const jwtAuthMiddlewareStudent = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized Token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.jwtpayload = decoded;
        if (!decoded.role || decoded.role != 'student') {
            console.log('Alert! jwt detection1')
            console.log(decoded.role)
                return res.status(401).json({ error: 'Access Denied , Role mismatch' });
        }
        console.log(decoded)
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const jwtAuthMiddlewareTeacher = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized Token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.jwtpayload = decoded;
        if (!decoded.role || decoded.role != 'teacher') {
            console.log('Alert! jwt detection 2')
            console.log(decoded.role)
            return res.status(401).json({ error: 'Access Denied , Role mismatch' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const jwtAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized Token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.jwtpayload = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET);
};

module.exports = { jwtAuthMiddleware, jwtAuthMiddlewareStudent, jwtAuthMiddlewareTeacher, generateToken };
