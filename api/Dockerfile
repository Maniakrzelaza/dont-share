# Ranking wyzwania dnia. Budowany z katalogu głównego repo (docker build -f api/Dockerfile .),
# bo liczy wynik regułami gry z web/js/cases.js — jedno źródło prawdy dla gry i serwera.
FROM node:24-alpine

WORKDIR /app
COPY web/js/cases.js web/js/scenes.js web/js/
COPY api/score.js api/server.js api/

ENV NODE_ENV=production PORT=8080 DS_DATA_DIR=/data/scores
RUN mkdir -p /data/scores && chown -R node:node /data

# Kontener nie ma powodu działać jako root.
USER node
EXPOSE 8080
CMD ["node", "api/server.js"]
