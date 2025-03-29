### Setup  

#### Prerequisites  
- **Node.js 18+**  
- **PostgreSQL** 
- **Redis** 

#### Installation  

1. **Clone the repository**  
   ```sh
   git clone https://github.com/AmalChandru/tickete-hiring-problem.git
   cd tickete-hiring-problem
   ```  

2. **Install dependencies**  
   ```sh
   npm install
   ```  

3. **Set up environment variables**  
   Copy `.env.example` to `.env` and update values as needed:  
   ```sh
   cp .env.example .env
   ```  

4. **Run database migrations**  
   ```sh
   npx prisma migrate dev
   ```  

5. **Start the server**  
   ```sh
   npm run start:dev
   ```  

6. **API is now available at**  
   ```
   http://localhost:3000
   ```
