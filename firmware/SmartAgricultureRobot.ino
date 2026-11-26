#include <ESP32Servo.h>
#include <DHT.h>

// ================================
// PIN CONFIGURATION
// ================================

#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 13

#define SOIL_SENSOR_PIN 34
#define PUMP_LED_PIN 26

#define DHT_PIN 27
#define DHT_TYPE DHT22


// ================================
// THRESHOLDS
// ================================

#define OBSTACLE_DISTANCE 20
#define DRY_SOIL 1300


// ================================
// OBJECTS
// ================================

Servo robotServo;
DHT dht(DHT_PIN, DHT_TYPE);


// ================================
// ROBOT MOVEMENT FUNCTIONS
// ================================

void moveForward() {
  Serial.println("ACTION: MOVE FORWARD");
}

void turnLeft() {
  Serial.println("ACTION: TURN LEFT");
}

void turnRight() {
  Serial.println("ACTION: TURN RIGHT");
}

void stopRobot() {
  Serial.println("ACTION: STOP");
}


// ================================
// IRRIGATION FUNCTIONS
// ================================

void turnPumpOn() {
  digitalWrite(PUMP_LED_PIN, HIGH);
  Serial.println("IRRIGATION: PUMP ON");
}

void turnPumpOff() {
  digitalWrite(PUMP_LED_PIN, LOW);
  Serial.println("IRRIGATION: PUMP OFF");
}


// ================================
// ULTRASONIC DISTANCE FUNCTION
// ================================

float getDistance() {

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);

  if (duration == 0) {
    return 400;
  }

  float distance = duration * 0.034 / 2;

  return distance;
}


// ================================
// IRRIGATION AGENT
// ================================

void irrigationAgent(
  int soilValue,
  float temperature,
  float humidity
) {

  Serial.println();
  Serial.println("===== IRRIGATION AGENT =====");

  // Check soil moisture
  if (soilValue < DRY_SOIL) {

    Serial.println("SOIL: DRY");

    // High priority irrigation condition
    if (temperature > 35 && humidity < 40) {

      Serial.println("PRIORITY: HIGH");

      Serial.println(
        "REASON: Dry soil + high temperature + low humidity"
      );

    }

    // Normal irrigation condition
    else {

      Serial.println("PRIORITY: NORMAL");

      Serial.println(
        "REASON: Soil moisture is low"
      );

    }

    // Turn irrigation ON
    turnPumpOn();

  }

  // Soil is sufficiently moist
  else {

    Serial.println("SOIL: MOIST/WET");

    Serial.println("PRIORITY: NONE");

    Serial.println(
      "REASON: Soil moisture is sufficient"
    );

    // Turn irrigation OFF
    turnPumpOff();
  }

  Serial.println("============================");
}


// ================================
// NAVIGATION AGENT
// ================================

void navigationAgent(
  float leftDistance,
  float centerDistance,
  float rightDistance
) {

  Serial.println();
  Serial.println("===== NAVIGATION AGENT =====");


  // --------------------------------
  // PATH CLEAR
  // --------------------------------

  if (centerDistance > OBSTACLE_DISTANCE) {

    Serial.println("PATH: CLEAR");

    Serial.println("DECISION: MOVE FORWARD");

    moveForward();
  }


  // --------------------------------
  // OBSTACLE DETECTED
  // --------------------------------

  else {

    Serial.println("PATH: BLOCKED");

    stopRobot();


    // Left side has more space
    if (leftDistance > rightDistance) {

      Serial.println("DECISION: TURN LEFT");

      turnLeft();
    }


    // Right side has more space
    else if (rightDistance > leftDistance) {

      Serial.println("DECISION: TURN RIGHT");

      turnRight();
    }


    // Both sides have same distance
    else {

      Serial.println(
        "DECISION: LEFT AND RIGHT BLOCKED"
      );

      Serial.println("DECISION: STOP");

      stopRobot();
    }
  }

  Serial.println("============================");
}


// ================================
// SETUP
// ================================

void setup() {

  Serial.begin(115200);


  // Ultrasonic sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);


  // Pump LED
  pinMode(PUMP_LED_PIN, OUTPUT);
  digitalWrite(PUMP_LED_PIN, LOW);


  // Servo
  robotServo.attach(SERVO_PIN);
  robotServo.write(90);


  // DHT22
  dht.begin();


  // Startup message
  Serial.println();
  Serial.println("====================================");
  Serial.println(" SMART AGRICULTURE ROBOT STARTED");
  Serial.println("====================================");
}


// ================================
// MAIN LOOP
// ================================

void loop() {

  // ==================================
  // 1. SOIL SENSOR
  // ==================================

  int soilValue = analogRead(SOIL_SENSOR_PIN);

  Serial.println();
  Serial.println("------ FARM SENSOR DATA ------");

  Serial.print("Soil Sensor: ");
  Serial.println(soilValue);


  // ==================================
  // 2. DHT22 SENSOR
  // ==================================

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("DHT22 ERROR: Reading failed");

  }

  else {

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");


    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");


    // Temperature decision
    if (temperature > 35) {

      Serial.println(
        "ENVIRONMENT: HIGH TEMPERATURE"
      );

    }

    else {

      Serial.println(
        "ENVIRONMENT: NORMAL TEMPERATURE"
      );
    }


    // Humidity decision
    if (humidity < 40) {

      Serial.println(
        "ENVIRONMENT: LOW HUMIDITY"
      );

    }

    else {

      Serial.println(
        "ENVIRONMENT: NORMAL HUMIDITY"
      );
    }


    // ==================================
    // 3. IRRIGATION AGENT
    // ==================================

    irrigationAgent(
      soilValue,
      temperature,
      humidity
    );
  }


  // ==================================
  // 4. LEFT SCAN
  // ==================================

  robotServo.write(30);

  delay(400);

  float leftDistance = getDistance();

  Serial.print("LEFT: ");
  Serial.print(leftDistance);
  Serial.println(" cm");


  // ==================================
  // 5. CENTER SCAN
  // ==================================

  robotServo.write(90);

  delay(400);

  float centerDistance = getDistance();

  Serial.print("CENTER: ");
  Serial.print(centerDistance);
  Serial.println(" cm");


  // ==================================
  // 6. RIGHT SCAN
  // ==================================

  robotServo.write(150);

  delay(400);

  float rightDistance = getDistance();

  Serial.print("RIGHT: ");
  Serial.print(rightDistance);
  Serial.println(" cm");


  // Return servo to center
  robotServo.write(90);


  // ==================================
  // 7. NAVIGATION AGENT
  // ==================================

  navigationAgent(
    leftDistance,
    centerDistance,
    rightDistance
  );


  Serial.println("====================================");


  // Wait before next cycle
  delay(1000);
}