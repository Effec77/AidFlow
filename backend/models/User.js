import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // --- Authentication Fields ---
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },
    role: { // Updated enum to include the four new roles
        type: String,
        enum: ['admin', 'branch manager', 'volunteer', 'affected citizen'],
        default: 'volunteer'
    },

    // --- Personal Information ---
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['', 'Male', 'Female', 'Other'], default: '' },

    // --- Contact/Location Information ---
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },

    // --- Affiliation & Skills ---
    companyType: {
        type: String,
        required: true,
        enum: ['NGO', 'Private', 'Individual', 'Government Employee', '']
    },
    occupation: { type: String, required: true, trim: true },
    volunteerSkills: {
        type: [String], // Array of strings 
        default: []
    },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Middleware: Hash the password before saving the user document
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to check the password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;

// --- EXPORT MOCK DATA FOR SEEDING ---
export const SEED_USERS = [
    {
        username: 'admin@edu.in',
        password: 'AdminPassword123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        country: 'USA',
        state: 'Texas',
        city: 'Houston',
        address: '100 Main St',
        companyType: 'Government Employee',
        occupation: 'System Administrator',
        volunteerSkills: ['Transport', 'Information Supply', 'Fundraising']
    },
    {
        username: 'branchmanager@edu.in',
        password: 'BranchManager123',
        role: 'branch manager',
        firstName: 'John',
        lastName: 'Manager',
        country: 'USA',
        state: 'California',
        city: 'Los Angeles',
        address: '300 Business Ave',
        companyType: 'Government Employee',
        occupation: 'Branch Manager',
        volunteerSkills: ['Transport', 'Information Supply']
    },
    {
        username: 'volunteer',
        password: 'VolunteerPass123',
        role: 'volunteer',
        firstName: 'Emma',
        lastName: 'Stone',
        country: 'USA',
        state: 'Florida',
        city: 'Miami',
        address: '200 River Rd',
        companyType: 'Individual',
        occupation: 'Logistics Coordinator',
        volunteerSkills: ['Transport']
    },
    {
        username: 'citizen@test.com',
        password: 'CitizenPass123',
        role: 'affected citizen',
        firstName: 'Sarah',
        lastName: 'Johnson',
        country: 'USA',
        state: 'New York',
        city: 'New York',
        address: '400 Main Street',
        companyType: 'Individual',
        occupation: 'Teacher',
        volunteerSkills: []
    },
];
