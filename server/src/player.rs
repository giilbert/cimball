use maf::*;

pub struct PlayerPlugin;

#[derive(Debug)]
struct ControlsStore {
    active_player: Option<Uuid>,
    left: bool,
    right: bool,
    want_launch: bool,
}

impl StoreData for ControlsStore {
    type Data = Self;

    fn init() -> Self::Data {
        ControlsStore {
            active_player: None,
            left: false,
            right: false,
            want_launch: false,
        }
    }

    fn name() -> impl AsRef<str> + Send {
        "controls"
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        (data.left, data.right, data.want_launch)
    }
}

async fn set_controls(
    user: User,
    controls: Store<ControlsStore>,
    Params((left, right, want_launch)): Params<(bool, bool, bool)>,
) {
    let mut controls = controls.write().await;

    if controls.left == left && controls.right == right && controls.want_launch == want_launch {
        return;
    }

    tracing::info!(
        "user {} set controls: left={}, right={}, want_launch={}",
        user.meta.id(),
        left,
        right,
        want_launch
    );

    controls.left = left;
    controls.right = right;
    controls.want_launch = want_launch;
}

impl Plugin for PlayerPlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        tracing::info!("player plugin loaded!");

        app.store::<ControlsStore>()
            .rpc("set_controls", set_controls)
    }
}
