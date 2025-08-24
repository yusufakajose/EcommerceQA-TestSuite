/**
 * Data Generator Utility
 * Provides methods to generate dynamic test data for various test scenarios
 */
class DataGenerator {
    constructor() {
        this.usedEmails = new Set();
        this.usedUsernames = new Set();
        this.usedPhoneNumbers = new Set();
    }
    /**
     * Generate a random string of specified length
     * @param {number} length - Length of the string
     * @param {string} charset - Character set to use
     * @returns {string} Random string
     */
    generateRandomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }
    /**
     * Generate a unique email address
     * @param {string} domain - Email domain (optional)
     * @returns {string} Unique email address
     */
    generateUniqueEmail(domain = 'testdomain.com') {
        let email;
        do {
            const username = this.generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz') +
                Math.floor(Math.random() * 1000);
            email = `${username}@${domain}`;
        } while (this.usedEmails.has(email));
        this.usedEmails.add(email);
        return email;
    }
    /**
     * Generate a random first name
     * @returns {string} Random first name
     */
    generateFirstName() {
        const firstNames = [
            'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
            'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Stephanie', 'Daniel',
            'Melissa', 'Matthew', 'Nicole', 'Anthony', 'Elizabeth', 'Mark', 'Helen',
            'Donald', 'Deborah', 'Steven', 'Rachel', 'Paul', 'Carolyn', 'Andrew', 'Janet'
        ];
        return firstNames[Math.floor(Math.random() * firstNames.length)];
    }
    /**
     * Generate a random last name
     * @returns {string} Random last name
     */
    generateLastName() {
        const lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
        ];
        return lastNames[Math.floor(Math.random() * lastNames.length)];
    }
    /**
     * Generate a secure password
     * @param {number} length - Password length (minimum 8)
     * @returns {string} Secure password
     */
    generateSecurePassword(length = 12) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        // Ensure at least one character from each category
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        // Fill the rest randomly
        const allChars = lowercase + uppercase + numbers + symbols;
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    /**
     * Generate a random phone number
     * @param {string} format - Phone number format
     * @returns {string} Random phone number
     */
    generatePhoneNumber(format = 'US') {
        let phoneNumber;
        do {
            if (format === 'US') {
                const areaCode = Math.floor(Math.random() * 800) + 200; // 200-999
                const exchange = Math.floor(Math.random() * 800) + 200; // 200-999
                const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                phoneNumber = `+1-${areaCode}-${exchange}-${number}`;
            }
            else {
                // International format
                const countryCode = Math.floor(Math.random() * 99) + 1;
                const number = Math.floor(Math.random() * 1000000000);
                phoneNumber = `+${countryCode}-${number}`;
            }
        } while (this.usedPhoneNumbers.has(phoneNumber));
        this.usedPhoneNumbers.add(phoneNumber);
        return phoneNumber;
    }
    /**
     * Generate a random date of birth
     * @param {number} minAge - Minimum age
     * @param {number} maxAge - Maximum age
     * @returns {string} Date of birth in YYYY-MM-DD format
     */
    generateDateOfBirth(minAge = 18, maxAge = 80) {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
        const randomDate = new Date(randomTime);
        return randomDate.toISOString().split('T')[0];
    }
    /**
     * Generate a random address
     * @returns {object} Random address object
     */
    generateAddress() {
        const streets = [
            'Main Street', 'Oak Avenue', 'Pine Road', 'Elm Street', 'Maple Drive',
            'Cedar Lane', 'Park Avenue', 'First Street', 'Second Street', 'Broadway',
            'Washington Street', 'Lincoln Avenue', 'Jefferson Road', 'Madison Drive'
        ];
        const cities = [
            'Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Clinton', 'Madison',
            'Washington', 'Arlington', 'Centerville', 'Lebanon', 'Kingston', 'Salem',
            'Fairview', 'Greenville', 'Bristol', 'Oxford', 'Ashland', 'Burlington'
        ];
        const states = [
            'CA', 'NY', 'TX', 'FL', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
            'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
        ];
        const streetNumber = Math.floor(Math.random() * 9999) + 1;
        const street = streets[Math.floor(Math.random() * streets.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        const zipCode = Math.floor(Math.random() * 90000) + 10000;
        return {
            street: `${streetNumber} ${street}`,
            city: city,
            state: state,
            zipCode: zipCode.toString(),
            country: 'United States'
        };
    }
    /**
     * Generate a complete user object
     * @param {object} overrides - Properties to override
     * @returns {object} Complete user object
     */
    generateUser(overrides = {}) {
        const firstName = this.generateFirstName();
        const lastName = this.generateLastName();
        const email = this.generateUniqueEmail();
        const password = this.generateSecurePassword();
        const phone = this.generatePhoneNumber();
        const dateOfBirth = this.generateDateOfBirth();
        const address = this.generateAddress();
        return {
            id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            firstName,
            lastName,
            email,
            password,
            phone,
            dateOfBirth,
            address,
            preferences: {
                newsletter: Math.random() > 0.5,
                notifications: Math.random() > 0.5
            },
            ...overrides
        };
    }
    /**
     * Generate test credit card data
     * @param {string} type - Card type (visa, mastercard, amex)
     * @returns {object} Credit card data
     */
    generateCreditCard(type = 'visa') {
        const cardData = {
            visa: {
                prefix: '4111111111111',
                length: 16
            },
            mastercard: {
                prefix: '555555555555',
                length: 16
            },
            amex: {
                prefix: '37828224631000',
                length: 15
            }
        };
        const card = cardData[type] || cardData.visa;
        const cardNumber = card.prefix + Math.floor(Math.random() * Math.pow(10, card.length - card.prefix.length))
            .toString().padStart(card.length - card.prefix.length, '0');
        const currentYear = new Date().getFullYear();
        const expiryYear = currentYear + Math.floor(Math.random() * 5) + 1; // 1-5 years from now
        const expiryMonth = Math.floor(Math.random() * 12) + 1;
        return {
            type: 'credit_card',
            cardNumber: cardNumber,
            expiryMonth: expiryMonth.toString().padStart(2, '0'),
            expiryYear: expiryYear.toString(),
            cvv: type === 'amex' ?
                Math.floor(Math.random() * 9000 + 1000).toString() : // 4 digits for Amex
                Math.floor(Math.random() * 900 + 100).toString(), // 3 digits for others
            cardholderName: `${this.generateFirstName()} ${this.generateLastName()}`
        };
    }
    /**
     * Generate product data
     * @param {object} overrides - Properties to override
     * @returns {object} Product object
     */
    generateProduct(overrides = {}) {
        const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'];
        const brands = ['TechCorp', 'StyleBrand', 'QualityMaker', 'Innovation Inc', 'Premium Co'];
        const basePrice = Math.floor(Math.random() * 500) + 10; // $10-$510
        const discount = Math.floor(Math.random() * 50); // 0-50% discount
        const salePrice = basePrice * (1 - discount / 100);
        return {
            id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: `Test Product ${Math.floor(Math.random() * 1000)}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            price: Math.round(salePrice * 100) / 100,
            originalPrice: basePrice,
            discount: discount,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
            reviewCount: Math.floor(Math.random() * 5000),
            inStock: Math.random() > 0.1, // 90% chance of being in stock
            stockQuantity: Math.floor(Math.random() * 200) + 1,
            description: `This is a test product description for testing purposes.`,
            brand: brands[Math.floor(Math.random() * brands.length)],
            ...overrides
        };
    }
    /**
     * Reset all used data sets (for test isolation)
     */
    reset() {
        this.usedEmails.clear();
        this.usedUsernames.clear();
        this.usedPhoneNumbers.clear();
    }
    /**
     * Generate bulk test data
     * @param {string} type - Type of data to generate (users, products, etc.)
     * @param {number} count - Number of items to generate
     * @param {object} overrides - Common overrides for all items
     * @returns {Array} Array of generated data
     */
    generateBulk(type, count, overrides = {}) {
        const data = [];
        for (let i = 0; i < count; i++) {
            switch (type) {
                case 'user':
                case 'users':
                    data.push(this.generateUser(overrides));
                    break;
                case 'product':
                case 'products':
                    data.push(this.generateProduct(overrides));
                    break;
                case 'creditCard':
                case 'creditCards':
                    data.push(this.generateCreditCard(overrides.type || 'visa'));
                    break;
                default:
                    throw new Error(`Unknown data type: ${type}`);
            }
        }
        return data;
    }
}
module.exports = DataGenerator;
