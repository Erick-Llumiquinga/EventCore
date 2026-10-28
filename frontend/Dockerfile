# 1. Lightweight Node.js base image
FROM node:20-alpine

# 2. Working directory inside the container
WORKDIR /app

# 3. Copy only the dependency manifests first (takes advantage of the Docker cache)
COPY package*.json ./

# 4. Install the dependencies
#RUN npm install
RUN npm install --legacy-peer-deps

# 5. Copy the rest of the frontend source code
COPY . .

# 6. Expose the default Vite port
EXPOSE 5173

# 7. Startup command: IMPORTANT to include '--', '--host'
# This causes Vite to listen on 0.0.0.0, allowing you to access it from your browser.
CMD ["npm", "run", "dev", "--", "--host"]
