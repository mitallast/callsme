use crate::participant::ParticipantConnection;
use crate::room::RoomId;
use crate::rooms_registry::RoomsRegistry;
use actix_files as fs;
use actix_web::middleware::Compress;
use actix_web::web::{Data, Payload, Query};
use actix_web::{App, Error, HttpRequest, HttpResponse, HttpServer, web};
use actix_web_actors::ws;
use clap::Parser;
use log::debug;
use mediasoup::prelude::*;
use serde::Deserialize;

mod messages;
mod participant;
mod room;
mod rooms_registry;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QueryParameters {
    room_id: Option<RoomId>,
}

/// Function that receives HTTP request on WebSocket route and upgrades it to WebSocket connection.
///
/// See https://actix.rs/docs/websockets/ for official `actix-web` documentation.
async fn ws_index(
    query_parameters: Query<QueryParameters>,
    request: HttpRequest,
    worker_manager: Data<WorkerManager>,
    rooms_registry: Data<RoomsRegistry>,
    settings: Data<Settings>,
    stream: Payload,
) -> Result<HttpResponse, Error> {
    let room = match query_parameters.room_id.clone() {
        Some(room_id) => {
            rooms_registry
                .get_or_create_room(&worker_manager, room_id)
                .await
        }
        None => rooms_registry.create_room(&worker_manager).await,
    };

    let room = match room {
        Ok(room) => room,
        Err(error) => {
            eprintln!("{error}");

            return Ok(HttpResponse::InternalServerError().finish());
        }
    };

    let announced_address = settings.announce.clone().or(Some("127.0.0.1".to_string()));
    match ParticipantConnection::new(room, announced_address).await {
        Ok(echo_server) => ws::start(echo_server, &request, stream),
        Err(error) => {
            eprintln!("{error}");

            Ok(HttpResponse::InternalServerError().finish())
        }
    }
}

async fn index() -> Result<fs::NamedFile, Error> {
    let file = fs::NamedFile::open("front/dist/index.html")?;
    Ok(file.use_etag(true))
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Settings {
    #[arg(long, default_value_t = 3000)]
    port: u16,

    #[arg(long)]
    listen: Option<String>,

    #[arg(long)]
    announce: Option<String>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let settings = Settings::parse();
    let host = settings
        .listen
        .clone()
        .unwrap_or_else(|| "0.0.0.0".to_string());
    let listen = format!("{}:{}", host, settings.port);
    debug!("Listening on {}", listen);

    // We will reuse the same worker manager across all connections, this is more than enough for
    // this use case
    let worker_manager = Data::new(WorkerManager::new());
    // Room registry will hold all the active rooms
    let rooms_registry = Data::new(RoomsRegistry::default());
    let settings_data = Data::new(settings);

    HttpServer::new(move || {
        App::new()
            .wrap(Compress::default())
            .app_data(worker_manager.clone())
            .app_data(rooms_registry.clone())
            .app_data(settings_data.clone())
            .route("/ws", web::get().to(ws_index))
            .route("/", web::get().to(index))
            .service(fs::Files::new("/assets", "front/dist/assets").use_etag(true))
    })
    // 2 threads is plenty for this example; the default is to have as many threads as CPU cores
    .workers(2)
    .bind(listen)?
    .run()
    .await
}
