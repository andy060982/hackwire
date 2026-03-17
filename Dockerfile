FROM node:20-alpine

WORKDIR /app

# Copy built files from .next
COPY .next ./.next
COPY public ./public
COPY package.json .
COPY next.config.ts .

# Install production dependencies only
RUN npm install --production

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
