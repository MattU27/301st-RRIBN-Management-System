This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Armed Forces of the Philippines Personnel Management System

This system is designed to manage personnel records for the Armed Forces of the Philippines, including tracking personnel information, training, documents, and more.

## Features

- Personnel management with Filipino military personnel records
- User role-based access control (Reservist, Enlisted, Staff, Admin, Director)
- Authentication and authorization
- Document management
- Training tracking
- Dashboard with analytics

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB installed locally or a MongoDB Atlas account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by creating a `.env.local` file in the root directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Seeding Filipino Military Personnel Data

To populate the database with realistic Filipino military personnel records:

1. Start the development server:
   ```
   npm run dev
   ```

2. Log in as an admin or director using one of the demo accounts:
   - Admin: `admin@afppms.mil` (password: `Admin@123`)
   - Director: `director@afppms.mil` (password: `Director@123`)

3. Run the seeding script:
   ```
   npm run seed:personnel
   ```

4. When prompted, enter your JWT token (from the browser's local storage or developer console)

5. Choose whether to clear existing personnel data

The seed script will add 12 Filipino military personnel with realistic data including:
- Filipino names, ranks, and service numbers
- Company assignments including NERRSC and NERRFAB units
- Military specializations
- Contact and emergency information

## Using the Personnel Management System

- **Viewing Personnel**: Navigate to the Personnel page to see all personnel records
- **Filtering**: Use the search box and dropdown filters to find specific personnel
- **Personnel Details**: Click on a personnel record to view detailed information
- **Adding/Editing**: Staff, Admin, and Director roles can add and edit personnel records

## License

This project is licensed under the MIT License

## Personnel Management

### Filipino Military Personnel Data

The system now includes realistic Filipino military personnel records with proper Filipino names, ranks, and military information. The personnel data integrates with MongoDB for persistent storage.

### Features
- View personnel filtered by company, status, or search terms
- Manage personnel records (add, edit, delete) based on user roles
- Display status with color coding (ready, standby, retired)
- Filter by specialized military units like NERRSC and NERRFAB

### Seeding Personnel Data

To populate the database with Filipino military personnel data:

1. Make sure your MongoDB connection is working
2. Start the development server: `npm run dev`
3. Get a JWT token by logging in as an admin or director
4. Run the seed script: `npm run seed:personnel`
5. Paste your JWT token when prompted
6. Choose whether to clear existing personnel data

This will add 12 realistic Filipino military personnel records to your database.

## Running the Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Access the application at [http://localhost:3000](http://localhost:3000)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Accessibility Features

This application is designed with accessibility in mind to ensure it can be used by everyone, including people with disabilities. We adhere to WCAG 2.1 AA standards to provide an inclusive user experience.

### Implemented Accessibility Features

- **Keyboard Navigation**: All interactive elements are accessible without a mouse
- **Screen Reader Support**: Semantic HTML with proper ARIA attributes
- **Skip to Content**: Allows keyboard users to bypass navigation
- **Focus Management**: Visible focus indicators that meet contrast requirements
- **Reduced Motion Support**: Respects user preferences for reduced animation
- **Text Alternatives**: Alt text for images and proper form labels
- **Color Contrast**: Text meets WCAG AA contrast requirements
- **Responsive Design**: Works with various zoom levels and device sizes

### Accessibility Components

Our codebase includes several specialized components to enhance accessibility:

- `SkipToContent`: Allows keyboard users to jump directly to main content
- `ScreenReaderAnnouncer`: Makes dynamic content changes perceivable to screen reader users
- Enhanced `Button`, `Card`, and form components with accessibility built-in

### Testing for Accessibility

We've included utilities for testing accessibility:

```bash
# Run accessibility tests
npm run test:a11y
```

Our `src/utils/a11y-tests.ts` includes helper functions for accessibility testing in components.

For more detailed guidelines, see our [Accessibility Documentation](./docs/ACCESSIBILITY.md).
