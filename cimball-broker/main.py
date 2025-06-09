import serial
import subprocess
import asyncio
import json
import time

from maf.python.client import MafClient

# PORT = "/dev/ttyACM0"

# port = serial.Serial(PORT, baudrate=115200, timeout=1, write_timeout=0)

current_state = {}
debounce = {}


async def main():
    async with MafClient(
        url="http://localhost:3000",
        # url="https://maf-server.fly.dev",
        app="gilbert/cimball",
    ) as client:

        async def notify_hit(key):
            parts = key.split("-")

            if parts[0] == "add":
                points = int(parts[1])

                print("adding points:", points)

                await client.rpc("add_points", points)
            elif parts[0] == "mul":
                multiplier = float(parts[1][:-1])
                duration = int(parts[2][:-1])

                print("adding multiplier:", multiplier, "for", duration, "seconds")

                await client.rpc("add_multiplier", multiplier, duration)

        async def run_camera():
            global current_state, debounce

            process = await asyncio.create_subprocess_shell(
                cmd="python3 -u camera.py",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )

            print("running camera process...")

            while True:
                line = await process.stdout.readline()
                if not line:
                    print("camera process ended")
                    break

                line = line.decode().strip().replace("<-", "")

                try:
                    data = json.loads(line)
                    assert isinstance(data, dict), "Expected a dictionary from camera"

                    for key in data.keys():
                        if key not in current_state:
                            current_state[key] = False

                        if current_state[key] != data[key]:
                            DEBOUNCE_TIME = 0.4  # seconds
                            new_state = data[key]

                            next_debounce = (
                                time.time_ns() + DEBOUNCE_TIME * 1_000_000_000
                            )
                            if key not in debounce:
                                asyncio.create_task(notify_hit(key))
                                debounce[key] = next_debounce
                            else:
                                if time.time_ns() < debounce[key]:
                                    continue
                                else:
                                    asyncio.create_task(notify_hit(key))
                                    debounce[key] = next_debounce

                            current_state[key] = new_state

                    current_state = data
                except Exception as e:
                    print("exception:", e)

        async def run_controls():
            store = client.store("controls")
            async for data in store.changed():
                print(f"store changed: {data}")

                if data[2]:
                    print("sending command to port")
                    # port.write(b"L\n")

                flipper_command = (
                    f"F{'1' if data[0] else '0'}{'1' if data[1] else '0'}\n"
                )
                # port.write(flipper_command.encode("ascii"))

        asyncio.create_task(run_controls())
        asyncio.create_task(run_camera())

        pass


if __name__ == "__main__":
    asyncio.run(main())
