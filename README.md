# 📄 CV Formatter

A full-stack application that allows users to upload CVs or resumes in PDF, DOCX, DOC, XLS, or XLSX formats, parse the content, edit it in a clean interface, and export the formatted version back as a downloadable DOCX file.

Includes authentication, file management, and AI-powered text formatting.

## 🚀 Features

### **🔐 Authentication**
- Secure user registration and login
- JWT-based authentication middleware
- Protected routes for file uploads and management

### **📤 File Upload & Parsing**
- Supports **PDF**, **DOCX**, **DOC**, **XLS**, and **XLSX** formats
- Uses:
  - `pdf-parse` for PDF text extraction
  - `mammoth` for DOCX/DOC parsing
  - `exceljs` for Excel file parsing
- Handles empty/corrupt file detection
- Preview of first 500 characters after parsing

### **📁 File Management**
- View uploaded files with pagination, sorting, and filtering
- Fetch individual file details
- Update the formatted CV content
- Delete uploaded CVs

### **💾 CV Export**
- Export formatted CV as a **DOCX**
- Original filename preserved with `_formatted` suffix
- Clean and safe filenames

### **🤖 AI Integration (Optional)**
- AI-assisted content reformatting
- API endpoints for AI-based CV improvements

## 🛠 Tech Stack

### **Frontend**
- ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) React.js
- ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) Axios for API requests
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) Tailwind CSS for styling

### **Backend**
- ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white) Node.js + Express.js
- ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white) MongoDB + Mongoose
- ![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens) JSON Web Tokens for authentication
- Multer for file uploads (memory storage)
- pdf-parse, mammoth, exceljs for file parsing
- bcryptjs for password hashing

## 📂 Project Structure

```
cv-formatter/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── api/
├── server/                 # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
├── .gitignore
├── package.json
└── README.md
```

## 📦 Installation & Setup

### **1. Clone the Repository**

```bash
git clone https://github.com/Mrfarooqui038501/CV-Formatter.git
cd cv-formatter
```

### **2. Install Dependencies**

**Install backend dependencies:**
```bash
cd server
npm install
```

**Install frontend dependencies:**
```bash
cd ../client
npm install
```

### **3. Environment Variables**

Create a `.env` file inside the `server/` directory with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=optional_for_ai_features
```

### **4. Database Setup**

Make sure you have MongoDB installed and running, or use MongoDB Atlas for cloud database:

1. Create a MongoDB database
2. Update the `MONGO_URI` in your `.env` file
3. The application will automatically create the required collections

## ▶️ Running the Project

### **Run Backend (Server)**
```bash
cd server
npm run dev
```

### **Run Frontend (Client)**
```bash
cd client
npm start
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 📡 API Endpoints

### **Authentication**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |

### **File Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files` | Upload file |
| `GET` | `/api/files` | Get all files (paginated) |
| `GET` | `/api/files/:id` | Get file by ID |
| `PUT` | `/api/files/:id` | Update formatted content |
| `DELETE` | `/api/files/:id` | Delete file |
| `GET` | `/api/files/:id/export` | Export formatted CV as DOCX |

## 🧑‍💻 Usage Flow

1. **Register** a new account or **Login**
2. **Upload** your CV in PDF/DOCX/DOC/XLS/XLSX format
3. The system **parses** the content and shows a preview
4. **Edit** the parsed content in the editor
5. **Save** the formatted content
6. **Export** the formatted CV as a DOCX file

## 🚧 Development

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### **Development Scripts**

**Backend:**
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
```

**Frontend:**
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run eject    # Eject from Create React App
```

## 🧪 Testing

Run tests for both frontend and backend:

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🐳 Docker Support

You can run the application using Docker:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a new branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m "Add new feature"`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Create** a Pull Request

### **Code Style**
- Use ESLint and Prettier for code formatting
- Follow conventional commit messages
- Write tests for new features

## 📝 Changelog

### **v1.0.0 (2024-01-15)**
- Initial release
- Basic file upload and parsing
- JWT authentication
- CV export functionality

### **v1.1.0 (2024-02-01)**
- Added AI integration
- Improved file parsing
- Enhanced UI/UX

## 🛡️ Security

- All user inputs are sanitized and validated
- JWT tokens for secure authentication
- File uploads are scanned for malicious content
- CORS properly configured for production

## 📈 Performance

- File processing is handled asynchronously
- Pagination for large file lists
- Optimized database queries
- Caching for frequently accessed data

## 🌐 Deployment

### **Frontend (Netlify/Vercel)**
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting provider

### **Backend (Heroku/Railway)**
1. Set environment variables
2. Deploy the `server` folder
3. Ensure MongoDB connection is configured

## ❓ FAQ

**Q: What file formats are supported?**
A: PDF, DOCX, DOC, XLS, and XLSX formats are currently supported.

**Q: Is there a file size limit?**
A: Yes, the current limit is 10MB per file.

**Q: Can I use this without an account?**
A: No, authentication is required for security and file management purposes.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Arman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 👨‍💻 Author

**Arman**
- GitHub: [@Mrfarooqui038501](https://github.com/Mrfarooqui038501)
- Email: armanfarooqui078601@gmail.com
- LinkedIn: [armanfarooqui038501](h www.linkedin.com/in/armanfarooqui038501)

## 🙏 Acknowledgments

- Thanks to all contributors who helped improve this project
- Inspired by the need for better CV formatting tools
- Built with love for the developer community

---

<div align="center">

**⭐ Star this repository if it helped you!**

[Report Bug](https://github.com/Mrfarooqui038501/cv-formatter/issues) · [Request Feature](https://github.com/Mrfarooqui038501/cv-formatter/issues) · [Documentation](https://github.com/Mrfarooqui038501/cv-formatter/wiki)

</div>