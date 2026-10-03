# Gra to statyczne pliki, więc obraz to sam serwer plików — bez etapu budowania.
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html dontshare.png /srv/

# SHA commita trafia do strony, żeby deploy.sh mógł sprawdzić, że serwer oddaje dokładnie to
# wydanie, a nie poprzednie, które jeszcze nie zdążyło zniknąć.
ARG DS_BUILD_SHA=dev
RUN sed -i "s/__BUILD_SHA__/${DS_BUILD_SHA}/" /srv/index.html

EXPOSE 80
