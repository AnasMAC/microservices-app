FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy pre-installed node_modules and pre-built .next artifacts directly from the host
# This avoids container network timeouts (like COPY target/*.jar in Java services)
COPY package.json ./
COPY node_modules ./node_modules
COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start"]
