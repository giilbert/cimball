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

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data.users
            .iter()
            .map(|user| user.name.clone())
            .collect::<Vec<_>>()
    }
}

fn on_connect(app: App) {
    println!("user connected!");
}

async fn join_queue(user: User, queue: Store<Queue>, Params(name): Params<String>) {
    let mut queue = queue.write().await;

    println!(
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
    println!("hello world!");

    App::builder()
        .on_connect(on_connect)
        .rpc("join_queue", join_queue)
        .build()
}

register!(build);
