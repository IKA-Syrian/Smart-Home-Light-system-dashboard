/* --------------------------------------------------------------------------
   SMART-LIGHT + RTC + ENERGY  – unified sketch for your three-LED controller
   --------------------------------------------------------------------------
   NEW FEATURES
   ● DAILY SCHEDULE  (serial "T<led><onHH><onMM><offHH><offMM>" or "C" to clear)
     ─ Example  T105300730  → LED1 ON 05:30, OFF 07:30 every day
   ● TIMED-ON ("T<index>:<secs>") kept exactly as before – both syntaxes co-exist.
   ● ENERGY COUNTER  (Wh since midnight) sent once a minute in STATUS line.
   ● USAGE COUNTER - Send "U" command to get normalized on-time for energy calculations.
   REQUIREMENTS
   ● Install "RTClib" by Adafruit from the Arduino Library Manager.
   -------------------------------------------------------------------------- */

#include <RTClib.h>

/* ---------- ORIGINAL USER SETTINGS ------------------------------------- */
const int pirPin = 2;              // PIR sensor (digital)
const int ledPins[] = {9, 10, 11}; // PWM outputs
const int numLeds = sizeof(ledPins) / sizeof(ledPins[0]);

/* ---------- NEW RTC + ENERGY SETTINGS ---------------------------------- */
RTC_DS3231 rtc;
// LED electrical characteristics
const float V_SOURCE = 5.0;                         // Arduino output voltage (V)
const float LED_VF[numLeds] = {2.0, 2.0, 2.0};      // LED forward voltage drop (V)
const float LED_R[numLeds] = {220.0, 220.0, 220.0}; // Current limiting resistor (ohms)
// Derived power calculations
float LED_I_MAX[numLeds]; // Maximum current (A)
float LED_P_MAX[numLeds]; // Maximum power (W)
// Usage tracking
unsigned long ledOnTimeMs[numLeds] = {0}; // Normalized on-time in milliseconds
unsigned long lastUpdateTime = 0;         // For tracking time between updates
unsigned long lastEnergyCalcTime = 0;     // For tracking energy calculation time
// Current power tracking
float currentPowerW[numLeds] = {0}; // Current power consumption in Watts

const uint32_t ENERGY_INTERVAL_MS = 60000UL; // push every minute

/* ---------- SCHEDULING DATA STRUCTURES --------------------------------- */
struct DailySchedule
{
    uint8_t onHH = 25; // 25 → disabled
    uint8_t onMM = 0;
    uint8_t offHH = 25;
    uint8_t offMM = 0;
};
DailySchedule ledSchedule[numLeds];

/* ---------- ORIGINAL GLOBALS (unchanged) ------------------------------- */
int brightness[numLeds];
bool ledActiveForMotion[numLeds];
bool ledManualControl[numLeds];
unsigned long scheduledOffTime[numLeds];
long originalScheduledDuration[numLeds];

unsigned long motionTime = 0;
const unsigned long motionHoldTime = 5000;

bool pirSensorEnabled = true;

/* ---------- NEW RUNTIME STATE ------------------------------------------ */
uint32_t lastEnergyPush = 0;
float whToday[numLeds] = {0};

/* ---------- HELPER: time-window test ----------------------------------- */
bool timeIsBetween(const DateTime &now,
                   uint8_t onH, uint8_t onM, uint8_t offH, uint8_t offM)
{
    uint16_t nowMin = now.hour() * 60 + now.minute();
    uint16_t onMin = onH * 60 + onM;
    uint16_t offMin = offH * 60 + offM;
    if (onMin == offMin)
        return false; // degenerate
    if (onMin < offMin)
        return (nowMin >= onMin && nowMin < offMin);
    else
        return !(nowMin >= offMin && nowMin < onMin); // spans 00:00
}

/* ---------- INITIALISATION -------------------------------------------- */
void initRTC()
{
    if (!rtc.begin())
    {
        Serial.println(F("ERR: RTC not found"));
        return;
    }
    if (rtc.lostPower())
        rtc.adjust(DateTime(__DATE__, __TIME__));
}

void initEnergyCalculation()
{
    // Calculate I_max and P_max for each LED based on components
    for (int i = 0; i < numLeds; i++)
    {
        // I_max = (V_source - Vf) / R
        LED_I_MAX[i] = (V_SOURCE - LED_VF[i]) / LED_R[i];
        // P_max = V_source * I_max
        LED_P_MAX[i] = V_SOURCE * LED_I_MAX[i];
    }
}

/* ---------- ENERGY ACCUMULATION + STATUS EXT --------------------------- */
void pushEnergyIfNeeded()
{
    uint32_t nowMs = millis();
    if (nowMs - lastEnergyPush < ENERGY_INTERVAL_MS)
        return;
    lastEnergyPush = nowMs;

    DateTime now = rtc.now();
    static uint8_t lastDay = now.day();
    if (now.day() != lastDay)
    { // new day → reset
        memset(whToday, 0, sizeof(whToday));
        memset(ledOnTimeMs, 0, sizeof(ledOnTimeMs));
        lastDay = now.day();
    }

    // Calculate energy used and update running totals
    updateEnergyTotals();
}

/* ---------- UPDATE ENERGY TOTALS -------------------------------------- */
void updateEnergyTotals()
{
    // Calculate energy used since last calculation
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - lastEnergyCalcTime;
    lastEnergyCalcTime = currentTime;

    // Skip the first calculation after reset to avoid huge elapsed times
    if (elapsedTime > 3600000)
    { // > 1 hour, likely a reset or overflow
        return;
    }

    for (int i = 0; i < numLeds; i++)
    {
        // Update current power consumption based on brightness
        float powerFactor = (float)brightness[i] / 255.0; // Scale power by brightness
        currentPowerW[i] = LED_P_MAX[i] * powerFactor;

        // Only add energy if LED has been on since last calculation
        if (brightness[i] > 0)
        {
            // Calculate energy used during this period based on brightness level
            // Energy in joules = Power * Time in seconds
            float joules = currentPowerW[i] * (elapsedTime / 1000.0);

            // Convert to Wh and add to running total
            whToday[i] += joules / 3600.0;
        }
    }
}

/* ---------- TRACK LED USAGE ------------------------------------------- */
void updateLedUsage()
{
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;

    // Update the on-time for each LED, normalized by brightness
    for (int i = 0; i < numLeds; i++)
    {
        // Normalize by brightness (0-255)
        // This means an LED at 50% brightness for 1 second counts as 0.5 seconds at full brightness
        ledOnTimeMs[i] += (elapsedTime * brightness[i]) / 255;
    }
}

/* ---------- APPLY DAILY SCHEDULES ------------------------------------- */
void applySchedules()
{
    DateTime now = rtc.now();
    for (uint8_t i = 0; i < numLeds; i++)
    {
        DailySchedule &s = ledSchedule[i];
        if (s.onHH == 25)
            continue; // schedule disabled
        bool shouldBeOn = timeIsBetween(now, s.onHH, s.onMM, s.offHH, s.offMM);
        if (!ledManualControl[i])
            brightness[i] = shouldBeOn ? 255 : 0;
    }
}

/* -----------------------------------------------------------------------
   SETUP
   ----------------------------------------------------------------------- */
void setup()
{
    Serial.begin(9600);
    pinMode(pirPin, INPUT);

    for (int i = 0; i < numLeds; i++)
    {
        pinMode(ledPins[i], OUTPUT);
        brightness[i] = 0;
        ledActiveForMotion[i] = true;
        ledManualControl[i] = false;
        scheduledOffTime[i] = 0;
        originalScheduledDuration[i] = 0;
        analogWrite(ledPins[i], 0);
    }
    initRTC();
    initEnergyCalculation();
    lastUpdateTime = millis();
    lastEnergyCalcTime = millis(); // Initialize energy calculation time
    Serial.println("Arduino Ready. RTC OK.");
}

/* -----------------------------------------------------------------------
   LOOP
   ----------------------------------------------------------------------- */
void loop()
{
    handleSerialCommands(); // ← extended below
    checkScheduledTasks();
    applySchedules();     // NEW
    pushEnergyIfNeeded(); // NEW
    updateLedUsage();     // NEW: track LED usage time

    /* -------- Motion detection -------- */
    if (pirSensorEnabled && digitalRead(pirPin) == HIGH)
    {
        motionTime = millis();
        for (int i = 0; i < numLeds; i++)
        {
            if (!ledManualControl[i] && ledActiveForMotion[i])
                brightness[i] = 255;
        }
    }

    /* -------- Fading after hold-time --- */
    if (millis() - motionTime > motionHoldTime)
    {
        for (int i = 0; i < numLeds; i++)
        {
            if (!ledManualControl[i] && brightness[i] > 0)
            {
                brightness[i] = max(0, brightness[i] - 5);
            }
        }
    }

    /* -------- Output to LEDs ----------- */
    for (int i = 0; i < numLeds; i++)
        analogWrite(ledPins[i], brightness[i]);

    delay(30);
}

/* -----------------------------------------------------------------------
   SCHEDULED-OFF CHECK  (original helper, unchanged)
   ----------------------------------------------------------------------- */
void checkScheduledTasks()
{
    for (int i = 0; i < numLeds; i++)
    {
        if (ledManualControl[i] && scheduledOffTime[i] != 0 && millis() >= scheduledOffTime[i])
        {
            brightness[i] = 0;
            ledManualControl[i] = false;
            scheduledOffTime[i] = 0;
            originalScheduledDuration[i] = 0;
            Serial.print("INFO: LED ");
            Serial.print(i);
            Serial.println(" timed-off");
            if (pirSensorEnabled && (millis() - motionTime <= motionHoldTime) && ledActiveForMotion[i])
                brightness[i] = 255;
        }
    }
}

/* -----------------------------------------------------------------------
   SERIAL COMMAND PARSER  – ORIGINAL + NEW SCHEDULER EXTENSIONS
   ----------------------------------------------------------------------- */
void handleSerialCommands()
{
    if (!Serial.available())
        return;
    String commandStr = Serial.readStringUntil('\n');
    commandStr.trim();
    if (commandStr.length() == 0)
        return;

    char commandType = commandStr.charAt(0);

    /* ---------- NEW: ENERGY/USAGE COMMANDS ----------------------------- */
    // Reset energy counters (R)
    if (commandType == 'R' && commandStr.length() == 1)
    {
        // Reset energy and usage counters
        for (int i = 0; i < numLeds; i++)
        {
            whToday[i] = 0;
            ledOnTimeMs[i] = 0;
        }
        lastEnergyCalcTime = millis();
        Serial.println("ACK: Energy counters reset");
        return;
    }

    // Power status (W)
    if (commandType == 'W' && commandStr.length() == 1)
    {
        // Update energy calculations
        updateEnergyTotals();

        // Send power status
        String p = "POWER;";
        for (int i = 0; i < numLeds; i++)
        {
            p += "LED";
            p += i;
            p += ":";
            p += String(currentPowerW[i], 6);
            p += "W;";
        }
        Serial.println(p);
        return;
    }

    /* ---------- NEW: USAGE REPORTING ------------------------------------ */
    if (commandType == 'U' && commandStr.length() == 1)
    {
        updateEnergyTotals(); // Update energy calculations before reporting
        sendUsageData();
        return;
    }

    /* ---------- NEW: QUICK TEST COMMANDS -------------------------------- */
    // Test LEDs with specific brightness for energy testing
    // Format: P<led><brightness> (P for Power test)
    if (commandType == 'P' && commandStr.length() >= 3)
    {
        int ledId = commandStr.charAt(1) - '0';
        int level = commandStr.substring(2).toInt();

        if (ledId >= 0 && ledId < numLeds && level >= 0 && level <= 255)
        {
            ledManualControl[ledId] = true;
            brightness[ledId] = level;

            // Output test data
            Serial.print("TEST: LED ");
            Serial.print(ledId);
            Serial.print(" set to brightness ");
            Serial.print(level);
            Serial.print(" (");
            Serial.print((level * 100) / 255);
            Serial.println("%)");

            // Output power calculations
            float powerFactor = (float)level / 255.0;
            float currentAmps = LED_I_MAX[ledId] * powerFactor;
            float powerWatts = LED_P_MAX[ledId] * powerFactor;

            Serial.print("POWER: I=");
            Serial.print(currentAmps * 1000, 2); // mA for readability
            Serial.print("mA, P=");
            Serial.print(powerWatts, 4);
            Serial.println("W");

            return;
        }
    }

    /* ---------- NEW: CLEAR ALL DAILY SCHEDULES -------------------------- */
    if (commandType == 'C' && commandStr.length() == 1)
    {
        for (auto &s : ledSchedule)
            s.onHH = s.offHH = 25;
        Serial.println("ACK: schedules cleared");
        return;
    }

    /* ---------- NEW: DAILY ON/OFF SCHEDULE ------------------------------ */
    if (commandType == 'T' && commandStr.length() == 10 && commandStr.indexOf(':') == -1)
    {
        uint8_t led = commandStr.charAt(1) - '0';
        if (led >= numLeds)
        {
            Serial.println("ERR: bad LED");
            return;
        }
        ledSchedule[led].onHH = commandStr.substring(2, 4).toInt();
        ledSchedule[led].onMM = commandStr.substring(4, 6).toInt();
        ledSchedule[led].offHH = commandStr.substring(6, 8).toInt();
        ledSchedule[led].offMM = commandStr.substring(8, 10).toInt();
        Serial.print("ACK: Daily schedule set for LED");
        Serial.println(led);
        return;
    }

    /* ---------- ORIGINAL COMMANDS (unchanged except they stay below) ---- */

    // Enable / disable PIR
    if (commandType == 'E')
    {
        pirSensorEnabled = true;
        Serial.println("PIR Enabled");
    }
    else if (commandType == 'D')
    {
        pirSensorEnabled = false;
        Serial.println("PIR Disabled");
    }

    // Query full status
    else if (commandType == 'Q')
    {
        sendFullStatus();
    }

    // LED motion config  (C<idx><0|1>)
    else if (commandType == 'C' && commandStr.length() == 3)
    {
        int ledIndex = commandStr.charAt(1) - '0';
        int state = commandStr.charAt(2) - '0';
        if (ledIndex >= 0 && ledIndex < numLeds && (state == 0 || state == 1))
        {
            ledActiveForMotion[ledIndex] = (state == 1);
            Serial.print("CMD: LED ");
            Serial.print(ledIndex);
            Serial.print(" motion ");
            Serial.println(state ? "ON" : "OFF");
        }
    }

    // LED persistent ON/OFF  (S<idx><0|1>)
    else if (commandType == 'S' && commandStr.length() == 3)
    {
        int ledIndex = commandStr.charAt(1) - '0';
        int state = commandStr.charAt(2) - '0';
        if (ledIndex >= 0 && ledIndex < numLeds && (state == 0 || state == 1))
        {
            ledManualControl[ledIndex] = true;
            brightness[ledIndex] = state ? 255 : 0;
            scheduledOffTime[ledIndex] = 0;
            originalScheduledDuration[ledIndex] = 0;
            Serial.print("CMD: LED ");
            Serial.print(ledIndex);
            Serial.print(state ? " ON" : " OFF");
            Serial.println(" persistently");
        }
    }

    // LED brightness (B<idx>:<level>)
    else if (commandType == 'B' && commandStr.indexOf(':') > 1)
    {
        int colon = commandStr.indexOf(':');
        int idx = commandStr.substring(1, colon).toInt();
        int level = commandStr.substring(colon + 1).toInt();
        if (idx >= 0 && idx < numLeds && level >= 0 && level <= 255)
        {
            ledManualControl[idx] = true;
            brightness[idx] = level;
            scheduledOffTime[idx] = 0;
            originalScheduledDuration[idx] = 0;
            Serial.print("CMD: LED ");
            Serial.print(idx);
            Serial.print(" brightness ");
            Serial.println(level);
        }
    }

    // LED auto mode (A<idx>)
    else if (commandType == 'A' && commandStr.length() == 2)
    {
        int idx = commandStr.charAt(1) - '0';
        if (idx >= 0 && idx < numLeds)
        {
            ledManualControl[idx] = false;
            scheduledOffTime[idx] = 0;
            originalScheduledDuration[idx] = 0;
            ledActiveForMotion[idx] = true;
            brightness[idx] = (pirSensorEnabled && (millis() - motionTime <= motionHoldTime))
                                  ? 255
                                  : 0;
            Serial.print("CMD: LED ");
            Serial.print(idx);
            Serial.println(" AUTO");
        }
    }

    // Timed-ON  (T<idx>:<sec>)  – kept as before
    else if (commandType == 'T' && commandStr.indexOf(':') > 1)
    {
        int colon = commandStr.indexOf(':');
        int idx = commandStr.substring(1, colon).toInt();
        long dur = commandStr.substring(colon + 1).toInt();
        if (idx >= 0 && idx < numLeds && dur > 0)
        {
            ledManualControl[idx] = true;
            brightness[idx] = 255;
            scheduledOffTime[idx] = millis() + dur * 1000UL;
            originalScheduledDuration[idx] = dur;
            Serial.print("CMD: LED ");
            Serial.print(idx);
            Serial.print(" ON for ");
            Serial.print(dur);
            Serial.println("s");
        }
    }

    else
    {
        Serial.print("ERR: Unknown cmd ");
        Serial.println(commandStr);
    }
}

/* -----------------------------------------------------------------------
   USAGE DATA REPORT
   ----------------------------------------------------------------------- */
void sendUsageData()
{
    // Update energy before sending report
    updateEnergyTotals();

    String s = "USAGE;";
    for (int i = 0; i < numLeds; i++)
    {
        s += "LED";
        s += i;
        s += ":";
        s += ledOnTimeMs[i];
        s += ";";
    }
    Serial.println(s);

    // Show energy in joules and watt-hours for each LED
    String e = "ENERGY;";
    for (int i = 0; i < numLeds; i++)
    {
        float joules = LED_P_MAX[i] * (ledOnTimeMs[i] / 1000.0);
        float wattHours = joules / 3600.0;
        e += "LED";
        e += i;
        e += ":";
        e += String(joules, 2);
        e += "J(";
        e += String(whToday[i], 6);
        e += "Wh);";
    }
    Serial.println(e);

    // Also show current power consumption
    String p = "POWER;";
    for (int i = 0; i < numLeds; i++)
    {
        p += "LED";
        p += i;
        p += ":";
        p += String(currentPowerW[i], 6);
        p += "W;";
    }
    Serial.println(p);
}

/* -----------------------------------------------------------------------
   STATUS REPORT  (extends original with energy counters)
   ----------------------------------------------------------------------- */
void sendFullStatus()
{
    // Update energy calculations before sending status
    updateEnergyTotals();

    String s = "STATUS;";
    s += "PIR:";
    s += pirSensorEnabled ? "1;" : "0;";

    // motion-active flag
    for (int i = 0; i < numLeds; i++)
    {
        s += "LM";
        s += i;
        s += ":";
        s += ledActiveForMotion[i] ? "1;" : "0;";
    }
    // manual control
    for (int i = 0; i < numLeds; i++)
    {
        s += "MC";
        s += i;
        s += ":";
        s += ledManualControl[i] ? "1;" : "0;";
    }
    // timed schedule active
    for (int i = 0; i < numLeds; i++)
    {
        s += "TS";
        s += i;
        s += ":";
        s += (scheduledOffTime[i] && ledManualControl[i]) ? "1;" : "0;";
    }
    // timed remaining
    for (int i = 0; i < numLeds; i++)
    {
        s += "TR";
        s += i;
        s += ":";
        if (scheduledOffTime[i] && ledManualControl[i] && originalScheduledDuration[i] > 0)
        {
            long rem = (scheduledOffTime[i] - millis()) / 1000;
            if (rem < 0)
                rem = 0;
            s += rem;
        }
        else
            s += "0";
        s += ";";
    }
    // brightness
    for (int i = 0; i < numLeds; i++)
    {
        s += "B";
        s += i;
        s += ":";
        s += brightness[i];
        s += ";";
    }

    // energy today (Wh to 6 dp for more precision)
    for (int i = 0; i < numLeds; i++)
    {
        s += "EN";
        s += i;
        s += ":";
        s += String(whToday[i], 6);
        s += ";";
    }

    // current power (W to 6 dp)
    for (int i = 0; i < numLeds; i++)
    {
        s += "PW";
        s += i;
        s += ":";
        s += String(currentPowerW[i], 6);
        s += ";";
    }

    Serial.println(s);
}