use std::time::Duration;

use maf::*;
use serde::Serialize;

#[derive(Serialize)]
pub struct Points {
    pub points: u64,
    pub multiplier: f64,
}

impl StoreData for Points {
    type Data = Points;

    fn init() -> Self::Data {
        Points {
            points: 0,
            multiplier: 1.0,
        }
    }

    fn name() -> impl AsRef<str> + Send {
        "points"
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data
    }
}

async fn add_multiplier(Params((amount, duration)): Params<(f64, f64)>, points: Store<Points>) {
    let store_clone = points.clone();
    let mut points = points.write().await;
    points.multiplier += amount;

    // Reset multiplier after duration
    if duration > 0.0 {
        tasks::spawn(async move {
            tasks::sleep(Duration::from_secs_f64(duration)).await;

            let mut points = store_clone.write().await;
            points.multiplier -= amount;
        });
    }
}

async fn add_points(Params(params): Params<f64>, points: Store<Points>) {
    let mut points = points.write().await;
    points.points += (params * points.multiplier) as u64;
}

pub struct PointsPlugin;

impl Plugin for PointsPlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        tracing::info!("points plugin loaded!");

        app.rpc("add_multiplier", add_multiplier)
            .rpc("add_points", add_points)
            .store::<Points>()
    }
}
