use maf::{serde_json::Value, *};

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

pub struct Admin {
    id: Uuid,
}

impl StoreData for Admin {
    type Data = Self;

    fn init() -> Self::Data {
        Admin { id: Uuid::new_v4() }
    }
}

async fn join_admin(user: User, admin: Store<Admin>, Params(secret): Params<String>) -> bool {
    const ADMIN_SECRET: &str = include_str!("../ADMIN_SECRET");
    admin.write().await.id = user.meta.id();
    println!("user {user_id} joined as admin", user_id = user.meta.id());
    secret == ADMIN_SECRET
}

async fn start_viewer(user: User, admin: Store<Admin>, app: App) {
    let admin_user = match app.user(admin.read().await.id).await {
        Some(user) => user,
        None => {
            println!("admin user not found");
            return;
        }
    };

    app.channel::<Uuid>("new_viewer")
        .send(&admin_user, user.meta.id())
        .expect("failed to send start_viewer message");
}

async fn admin_send_ice_candidate(
    user: User,
    admin: Store<Admin>,
    app: App,
    Params((viewer_id, candidate)): Params<(Uuid, Value)>,
) {
    if user.meta.id() != admin.read().await.id {
        println!("user {user_id} is not admin", user_id = user.meta.id());
        return;
    }

    let viewer = match app.user(viewer_id).await {
        Some(user) => user,
        None => {
            println!("viewer user not found");
            return;
        }
    };

    println!("admin send ice candidate: viewer={viewer_id}, candidate={candidate}");

    app.channel::<Value>("ice_candidate")
        .send(&viewer, candidate)
        .expect("failed to send ice candidate");
}

async fn viewer_send_ice_candidate(
    user: User,
    admin: Store<Admin>,
    app: App,
    Params(candidate): Params<Value>,
) {
    let admin_user = match app.user(admin.read().await.id).await {
        Some(user) => user,
        None => {
            println!("admin user not found");
            return;
        }
    };

    println!("viewer send ice candidate: candidate={candidate:?}");

    app.channel::<(Uuid, Value)>("ice_candidate")
        .send(&admin_user, (user.meta.id(), candidate))
        .expect("failed to send ice candidate");
}

async fn viewer_offer_response(
    user: User,
    admin: Store<Admin>,
    app: App,
    Params((viewer_id, sdp)): Params<(Uuid, String)>,
) {
    if user.meta.id() != admin.read().await.id {
        println!("user {user_id} is not admin", user_id = user.meta.id());
        return;
    }

    let user = match app.user(viewer_id).await {
        Some(user) => user,
        None => {
            println!("viewer user not found");
            return;
        }
    };

    println!("viewer offer response: viewer={viewer_id}");

    app.channel::<String>("viewer_offer_response")
        .send(&user, sdp)
        .expect("failed to send viewer offer response");
}

async fn viewer_answer(user: User, admin: Store<Admin>, app: App, Params(sdp): Params<String>) {
    let admin_user = match app.user(admin.read().await.id).await {
        Some(user) => user,
        None => {
            println!("admin user not found");
            return;
        }
    };

    println!("finalize viewer: viewer={}", user.meta.id());

    app.channel::<(Uuid, String)>("finalize_viewer")
        .send(&admin_user, (user.meta.id(), sdp))
        .expect("failed to send finalize viewer message");
}

fn build() -> App {
    println!("hello world!");

    App::builder()
        .on_connect(on_connect)
        .rpc("join_queue", join_queue)
        .rpc("join_admin", join_admin)
        .rpc("start_viewer", start_viewer)
        .rpc("viewer_offer_response", viewer_offer_response)
        .rpc("viewer_answer", viewer_answer)
        .rpc("admin_send_ice_candidate", admin_send_ice_candidate)
        .rpc("viewer_send_ice_candidate", viewer_send_ice_candidate)
        .build()
}

register!(build);
