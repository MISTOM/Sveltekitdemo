# Sneaker Empire Backend

This is the backend for the Sneaker Empire application. It's built with SvelteKit Endpoints, Prisma ORM, and other technologies.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js v21.x
- npm v10.x
- Mysql running

#### .env.example

```env
DATABASE_URL = '';
SECRET_KEY = '';
REFRESH_KEY = '';
RESET_KEY = '';
CLOUDINARY_NAME = '';
CLOUDINARY_API_KEY = '';
CLOUDINARY_API_SECRET = '';
SENDGRID_API_KEY = '';
BASE_URL = 'https://sneaker-empire-ten.vercel.app';
BODY_SIZE_LIMIT = 'Infinity';
```

### Installing

1. Clone the repository

```bash
git clone https://github.com/Transcomm/sneaker-empire-backend.git
```

2. Install NPM packages

```bash
npm i
```

3. Run migrations and seed the Database

```bash
npx prisma migrate dev && npx prisma db seed
```

4. Initialize the Prisma Client

```bash
npx prisma generate
```

5. Start Development server

```bash
npm run dev
```

## Deployment

To build the application, run:

```bash
npm run build
```

Then you can preview your production build locally

```bash
npm run preview
```

## Documentation

For more details on the API endpoints and how to use them, check out the [Postman documentation](https://documenter.getpostman.com/view/23435200/2s9YyvCLSR).
