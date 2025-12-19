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

// --- EXPORT SEED DATA FOR PUNJAB, INDIA ---
export const SEED_USERS = [
    {
        username: 'admin@punjab.gov.in',
        password: 'AdminPassword123',
        role: 'admin',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        country: 'India',
        state: 'Punjab',
        city: 'Chandigarh',
        address: 'Sector 17, Chandigarh',
        companyType: 'Government Employee',
        occupation: 'Emergency Response Administrator',
        volunteerSkills: ['Transport', 'Information Supply', 'Fundraising']
    },
    {
        username: 'branchmanager@punjab.gov.in',
        password: 'BranchManager123',
        role: 'branch manager',
        firstName: 'Preet',
        lastName: 'Singh',
        country: 'India',
        state: 'Punjab',
        city: 'Ludhiana',
        address: 'Civil Lines, Ludhiana',
        companyType: 'Government Employee',
        occupation: 'Regional Emergency Manager',
        volunteerSkills: ['Transport', 'Information Supply']
    },
    {
        username: 'volunteer@ngo.org',
        password: 'VolunteerPass123',
        role: 'volunteer',
        firstName: 'Simran',
        lastName: 'Kaur',
        country: 'India',
        state: 'Punjab',
        city: 'Amritsar',
        address: 'Golden Temple Road, Amritsar',
        companyType: 'NGO',
        occupation: 'Relief Coordinator',
        volunteerSkills: ['Transport', 'Medical Aid', 'Fundraising']
    },
    {
        username: 'citizen@punjab.in',
        password: 'CitizenPass123',
        role: 'affected citizen',
        firstName: 'Harpreet',
        lastName: 'Sharma',
        country: 'India',
        state: 'Punjab',
        city: 'Jalandhar',
        address: 'Model Town, Jalandhar',
        companyType: 'Individual',
        occupation: 'School Teacher',
        volunteerSkills: []
    },
];
