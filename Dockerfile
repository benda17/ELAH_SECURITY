# Optional local packaging; NOT used by Vercel.
# This image is for local/dev packaging of the ELAH scoring service.
# Vercel does not use this Dockerfile.

FROM node:20-bookworm-slim

WORKDIR /app

# Copy the repo, then install Linux deps so a host node_modules tree is not used.
COPY . .
RUN rm -rf node_modules && npm ci

# next build is skipped (too heavy for this local image).
# Override CMD with `npx tsx <script>` or `npm start` after a local next build.
# Pass ELAH_SERVICE_TOKEN at runtime; do not bake secrets into the image.

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "--eval", "console.log('ELAH local image. Override CMD with npx tsx <script> or npm start after next build.')"]
