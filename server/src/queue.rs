use maf::*;

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

    fn name() -> impl AsRef<str> + Send {
        "queue"
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data.users
            .iter()
            .map(|user| user.name.clone())
            .collect::<Vec<_>>()
    }
}

async fn join_queue(user: User, queue: Store<Queue>, Params(name): Params<String>) {
    let mut queue = queue.write().await;

    if queue.users.iter().any(|u| u.id == user.meta.id()) {
        tracing::info!(
            "user {name} ({user_id}) already in the queue. length: {}",
            queue.users.len(),
            user_id = user.meta.id()
        );
        return;
    }

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

pub struct QueuePlugin;

impl Plugin for QueuePlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        tracing::info!("queue plugin loaded!");

        app.store::<Queue>().rpc("join_queue", join_queue)
    }
}
