import cv2 as cv
import json
from dataclasses import dataclass


@dataclass
class Region:
    id: str
    x: int
    y: int
    width: int
    height: int

    def p1(self):
        return (self.x, self.y)

    def p2(self):
        return (self.x + self.width, self.y + self.height)


print("OpenCV version: ", cv.__version__)

regions = [
    Region("mul-1.5x-10s-1", 465, 60, 50, 40),
    Region("add-100-1", 465, 240, 45, 40),
    Region("add-100-2", 600, 180, 50, 50),
    Region("mul-1.5x-5s-2", 850, 230, 50, 50),
    Region("add-100-3", 820, 360, 50, 50),
    Region("add-100-4", 520, 290, 50, 50),
    Region("add-100-5", 520, 290, 50, 50),
    Region("add-50-5", 680, 430, 40, 150),
]

prev_region_statuses = {}
region_statuses = {}


def post_region_statuses(current_statuses, prev_statuses):
    if current_statuses == prev_statuses:
        return

    print("<-" + json.dumps(region_statuses))


video = cv.VideoCapture("/dev/video4")

if not video.isOpened():
    print("Error: Could not open video.")
    exit()

while True:
    prev_region_statuses = region_statuses.copy()
    is_error, frame = video.read()

    if not is_error:
        print("Can't receive frame (stream end?). Exiting ...")
        break

    gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
    # make really dark grays black and really light grays white
    gray = cv.threshold(gray, 120, 255, cv.THRESH_BINARY)[1]

    # convert to color for drawing
    display = gray.copy()
    display = cv.cvtColor(display, cv.COLOR_GRAY2BGR)

    for region in regions:

        # crop the region of interest
        cropped = gray.copy()[
            region.y : region.y + region.height,
            region.x : region.x + region.width,
        ]

        # calculate the mean of the cropped region
        mean_value = cv.mean(cropped)[0]

        OBJECT_IN_THRESHOLD = 250
        if mean_value < OBJECT_IN_THRESHOLD:
            region_statuses[region.id] = True
        else:
            region_statuses[region.id] = False

        # draw a rectangle around the region of interest
        cv.rectangle(
            display,
            region.p1(),
            region.p2(),
            (0, 0, 255),
            2,
        )

    cv.imshow("frame", display)

    post_region_statuses(region_statuses, prev_region_statuses)

    if cv.waitKey(1) == ord("q"):
        break


video.release()
cv.destroyAllWindows()
