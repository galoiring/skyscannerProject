# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the project files to the working directory
COPY . .

# Expose a port (optional)
EXPOSE 3000

# Specify the command to run your application
CMD ["npm", "test", "--name", "SkyscannerProject"]


## for executing use: ' docker build -t your-image-name . '