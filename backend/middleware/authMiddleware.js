import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function authMiddleware (req, res, next ){
    try {
        const header =req.headers.authorization ;
        if (!header) return res.status(401).json({ error: 'missing auth header' });

        if(!header.startsWith('Bearer ')) return res.status(401).json({error : 'invalid auth header'});

        const token = header.split(' ')[1]; 

        let decoded ;
        try {
            decoded = jwt.verify(token, JWT_SECRET); 
        } catch (e) {
            return res.status(401).json({ error: 'invalid or expired token' });
        }

        const user = await User.findById(decoded.id).select('_id email name role');

        if(!user) return res.status(401).json({error: 'user not found'});
        
        req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
        };
        next() ;
    }catch (err) {
    next(err);
  }
}

// convenience wrapper ... 
export function requireAuth(handler) {
  return function (req, res, next) {
    authMiddleware(req, res, (err) => {
      if (err) return next(err);
      handler(req, res, next);
    });
  };
}