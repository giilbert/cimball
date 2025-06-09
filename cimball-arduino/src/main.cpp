#include <Arduino.h>

#include "launch.hpp"

const int LEFT_FLIPPER_PIN = 5;
const int RIGHT_FLIPPER_PIN = 6;

const int LEFT_FLIPPER_INITIAL_ANGLE = 30;
const int LEFT_FLIPPER_MAX_ANGLE = 0;

const int RIGHT_FLIPPER_INITIAL_ANGLE = 0;
const int RIGHT_FLIPPER_MAX_ANGLE = 30;

Servo leftFlipperServo;
Servo rightFlipperServo;

void setup()
{
    Serial.begin(115200);

    setupLaunchMotors();

    leftFlipperServo.attach(LEFT_FLIPPER_PIN);
    rightFlipperServo.attach(RIGHT_FLIPPER_PIN);

    leftFlipperServo.write(0);
    rightFlipperServo.write(0);

    Serial.println("Hello! Serial communication started.");
}

void handleCommand(String command)
{
    // Remove whitespace (\n, \r, spaces) from the front/end of the string
    command.trim();

    char commandType = command.charAt(0);

    if (commandType == 'L')
    {
        Serial.println("Launching");
        launch(150);
    }
    else if (commandType == 'F')
    {
        bool isLeftFlipperOn = command.charAt(1) == '1';
        bool isRightFlipperOn = command.charAt(2) == '1';

        Serial.print("Left: ");
        Serial.print(isLeftFlipperOn ? "ON" : "OFF");
        Serial.print(" | Right: ");
        Serial.println(isRightFlipperOn ? "ON" : "OFF");

        leftFlipperServo.write(isLeftFlipperOn ? LEFT_FLIPPER_MAX_ANGLE : LEFT_FLIPPER_INITIAL_ANGLE);
        rightFlipperServo.write(isRightFlipperOn ? RIGHT_FLIPPER_MAX_ANGLE : RIGHT_FLIPPER_INITIAL_ANGLE);
    }
    else
    {
        Serial.println("Unknown command: " + command);
    }
}

void loop()
{
    static String readBuffer = "";

    // Non-blocking read from Serial
    if (Serial.available())
    {
        char c = Serial.read();

        if (c == '\n' || c == '\r')
        {
            // End of command detected
            handleCommand(readBuffer);
            readBuffer = "";
        }
        else
        {
            readBuffer += c;
        }
    }
}
