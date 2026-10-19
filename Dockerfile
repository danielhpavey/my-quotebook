# Local development image. Debian (not Alpine) so @resvg/resvg-js picks up
# its prebuilt glibc binary.
FROM node:24-bookworm-slim

WORKDIR /app

# Install deps first so this layer is cached until the lockfile changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4321

# Bind to 0.0.0.0 so the dev server is reachable from outside the container.
# --ignore-lock: .astro/ is bind-mounted, so a lock file left by a stopped
# container would otherwise block the next start
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--ignore-lock"]
