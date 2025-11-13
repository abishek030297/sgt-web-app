# Gold Assay Management System

A comprehensive web application for managing gold purity analysis and generating professional assay reports with QR code functionality.

## 🌟 Features

### 🔐 Authentication & Security
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected API endpoints

### 📊 Dashboard
- Real-time statistics and analytics
- Recent assay reports overview
- Quick access to key metrics
- Visual data representation

### 👥 Customer Management
- Add new customers with complete details
- Edit existing customer information
- Delete customers (with referential integrity checks)
- Customer search and filtering
- ID verification support (Passport, Driver License, National ID, Aadhar)

### 🔬 Assay Report Management
- Create gold purity analysis reports
- Edit existing assay reports
- Delete reports
- Generate professional PDF-style reports
- QR code generation for customer access
- Multiple metal type support (Gold, Silver, Platinum)

### 📱 QR Code Integration
- Automatic QR code generation for each report
- Customers can scan to view their reports online
- Downloadable QR codes
- Public report viewing without authentication

### 🎨 User Experience
- Responsive design for all devices
- Modern Angular 20+ interface
- Bootstrap 5 styling
- Intuitive navigation
- Real-time form validation

## 🛠️ Technology Stack

### Frontend
- **Angular 20+** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Bootstrap 5** - Responsive UI components
- **RxJS** - Reactive programming
- **QRCode.js** - QR code generation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Database management
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **MySQL** - Relational database
- **XAMPP** - Local development environment

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v20.19.5 or higher)
- **Angular CLI** (v20.3.9 or higher)
- **MySQL** (v8.0 or higher) or **XAMPP**
- **npm** (v11.6.2 or higher)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gold-assay-system
```

### 2. Backend Setup

#### Navigate to backend directory:
```bash
cd backend
```

#### Install dependencies:
```bash
npm install
```

#### Environment Configuration:
Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gold_assay_system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=3000
```

#### Database Setup:
1. Start MySQL (XAMPP recommended for Windows)
2. Create database `gold_assay_system`
3. Run the schema from `backend/database/schema.sql`

#### Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

#### Navigate to frontend directory:
```bash
cd frontend
```

#### Install dependencies:
```bash
npm install
```

#### Start the development server:
```bash
ng serve
```

The frontend will run on `http://localhost:4200`

## 📁 Project Structure

```
gold-assay-system/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── database/
│       └── schema.sql         # Database schema
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Angular components
│   │   │   ├── services/      # API services
│   │   │   ├── guards/        # Route guards
│   │   │   └── app.config.ts  # App configuration
│   │   ├── environments/      # Environment configurations
│   │   └── index.html         # Main HTML file
│   ├── angular.json           # Angular configuration
│   └── package.json           # Frontend dependencies
└── README.md                  # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get specific customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Assay Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/analytics/reports-by-date` - Reports by date
- `GET /api/analytics/reports-by-metal` - Reports by metal type

### Public Access
- `GET /api/public/reports/:id` - Public report view (QR codes)

## 👤 Default Login

After setting up the database, use these credentials to login:

- **Username**: `admin`
- **Password**: `password`

## 💾 Database Schema

The system uses the following main tables:

### Users Table
- Stores user account information
- Includes username, email, hashed password, and profile data

### Customers Table
- Stores customer information
- Includes contact details and ID verification data
- Linked to users for multi-tenant support

### Assay Reports Table
- Stores gold purity analysis results
- Includes metal type, fineness, weight, and assay details
- Linked to customers and users

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: Secure authentication with 24-hour token expiry
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Using parameterized queries
- **XSS Protection**: Input sanitization and output encoding

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🎯 Key Functionality

### For Laboratory Staff:
- Create and manage customer records
- Perform gold purity analysis
- Generate professional assay reports
- Print reports in standardized format
- Manage report history

### For Customers:
- View their assay reports via QR codes
- Access report details online
- Download/print their certificates

## 🔄 Workflow

1. **Customer Registration** → Add customer details
2. **Assay Analysis** → Perform gold purity testing
3. **Report Generation** → Create assay report with QR code
4. **Customer Access** → Customer scans QR to view report
5. **Management** → Edit/update records as needed

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check .env file configuration
   - Verify database exists

2. **Authentication Issues**
   - Check JWT secret in .env
   - Verify token expiration
   - Clear browser localStorage

3. **CORS Errors**
   - Ensure backend CORS is configured for frontend URL
   - Check port configurations

4. **QR Code Not Working**
   - Verify public report endpoint accessibility
   - Check report ID in URL

## 📞 Support

For technical support or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure database is properly configured
4. Check console logs for error details

## 📄 License

This project is licensed for internal use. Please contact the development team for licensing information.

## 🚀 Deployment

### Production Deployment Notes:

1. **Environment Variables**
   - Update JWT secret for production
   - Set proper database credentials
   - Configure production API URLs

2. **Security**
   - Enable HTTPS
   - Set secure CORS policies
   - Use production-grade JWT secrets

3. **Performance**
   - Enable compression
   - Configure database connection pooling
   - Set up caching where appropriate

---

**Built with ❤️ for the Gold Assay Industry**