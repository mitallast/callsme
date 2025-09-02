FROM rust:1.89-bullseye AS rust-builder

WORKDIR /usr/src/app

RUN set -eux; \
    rustup component add rustfmt; \
    apt-get update; \
    apt-get install -y --no-install-recommends python3-pip libc6; \
    rm -rf /var/lib/apt/lists/*; update-ca-certificates

# Слой для кэширования зависимостей
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Сборка основного кода
COPY src ./src
RUN touch -m ./src/main.rs
RUN cargo build --release

FROM node:lts AS npm-builder

WORKDIR /usr/src/app

COPY ./front/eslint.config.mjs ./front/index.html ./front/package.json ./front/package-lock.json ./front/tsconfig.json ./
COPY ./front/src ./src

RUN npm install . && npm run build

FROM debian:bullseye-slim
WORKDIR /usr/src/app

COPY --from=rust-builder /usr/src/app/target/release/callsme ./
COPY --from=npm-builder /usr/src/app/dist ./front/dist

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends libc6 libgcc-s1 ca-certificates tzdata; \
  rm -rf /var/lib/apt/lists/*; update-ca-certificates

ENV RUST_LOG='debug'

CMD ["./callsme", "--listen", "0.0.0.0", "--port", "3000", "--announce", "127.0.0.1"]
