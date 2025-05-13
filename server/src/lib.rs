mod error;
mod video;

use maf::*;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Default, serde::Serialize)]
struct Queue {
    users: Vec<QueuedUser>,
}

#[derive(Debug, serde::Serialize)]
struct QueuedUser {
    id: Uuid,
    name: String,
}

impl StoreData for Queue {
    type Data = Self;

    fn init() -> Self::Data {
        Queue::default()
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data.users
            .iter()
            .map(|user| user.name.clone())
            .collect::<Vec<_>>()
    }
}

fn on_connect(_app: App, user: User) {
    tracing::info!("user {} connected!", user.meta.id());
}

async fn join_queue(user: User, queue: Store<Queue>, Params(name): Params<String>) {
    let mut queue = queue.write().await;

    tracing::info!(
        "user {name} ({user_id}) joined the queue. length: {}",
        queue.users.len(),
        user_id = user.meta.id()
    );

    queue.users.push(QueuedUser {
        id: user.meta.id(),
        name,
    });
}

fn build() -> App {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    App::builder()
        .on_connect(on_connect)
        .rpc("join_queue", join_queue)
        .plugin(video::VideoPlugin)
        .build()
}

register!(build);
