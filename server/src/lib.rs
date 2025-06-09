mod error;
mod player;
mod points;
mod queue;
mod video;

use maf::*;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn on_connect(_app: App, user: User) {
    tracing::info!("user {} connected!", user.meta.id());
}

fn build() -> App {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    App::builder()
        .on_connect(on_connect)
        .plugin(points::PointsPlugin)
        .plugin(player::PlayerPlugin)
        .plugin(video::VideoPlugin)
        .plugin(queue::QueuePlugin)
        .build()
}

register!(build);
