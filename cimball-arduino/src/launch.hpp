#include <Arduino.h>
#include <Servo.h>

const int UP_POSITION = 85;
const int DOWN_POSITION = 102;

const int UP_DOWN_SERVO_PIN = 9;
const int LAUNCH_SERVO_PIN = 10;

Servo upDownServo;
Servo launchServo;

void setupLaunchMotors()
{
    upDownServo.attach(UP_DOWN_SERVO_PIN);
    launchServo.attach(LAUNCH_SERVO_PIN);

    launchServo.write(0);
    upDownServo.write(UP_POSITION);
}

void reset()
{
    upDownServo.write(UP_POSITION);
    delay(300);
    launchServo.write(0);
}

void launch(int pullBack)
{
    upDownServo.write(DOWN_POSITION);
    delay(1500);
    const int PULL_BACK_STEPS = 6;

    for (int i = 0; i < PULL_BACK_STEPS; i++)
    {
        int currentPosition = map(i, 0, PULL_BACK_STEPS - 1, 0, pullBack);
        launchServo.write(currentPosition);
        delay(500);
    }
    delay(2500);
    reset();
}
