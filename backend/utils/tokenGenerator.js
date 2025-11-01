import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Ensure you have a SECRET defined in your .env file:
// JWT_SECRET="your_very_secure_secret_key_here"

/**
 * @description Generates a JSON Web Token (JWT) for the authenticated user.
 * @param {string} id - The user's MongoDB unique ID.
 * @param {string} role - The user's role (viewer, manager, admin).
 * @returns {string} The generated JWT string.
 */
const generateToken = (id, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in the .env file. Cannot generate token.");
    }
    
    return jwt.sign(
        { id, role }, // Payload: User ID and Role
        process.env.JWT_SECRET, // Secret key from .env
        { expiresIn: '30d' } // Token expiry time
    );
};

export default generateToken;
