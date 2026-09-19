# Indian Road Navigator

Design and develop a software-based simulation prototype for “Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads.”

Objective

Develop an autonomous vehicle that can safely navigate unpredictable Indian roads by detecting road users and obstacles, predicting their movement, planning collision-free paths, and replanning in real time when road conditions change.

Problem Context

The system should handle cars, buses, trucks, auto-rickshaws, two-wheelers, bicycles, pedestrians, pushcarts and animals, along with missing lane markings, informal merging, wrong-way movement, potholes, sudden pedestrian movement and unmarked intersections.

System Pipeline

Camera + LiDAR + Radar → Perception → Object Detection → Motion Prediction → Decision Making → Adaptive Path Planning → Collision Avoidance → Vehicle Control → Real-Time Replanning

Core Functionalities

Detect and track vehicles, pedestrians, animals and obstacles.

Identify road boundaries even without lane markings.

Predict the short-term movement of nearby objects.

Detect collision risks and decide whether to continue, slow down, stop or change direction.

Generate safe and smooth paths while maintaining a safe distance.

Replan immediately when new obstacles or unexpected movements occur.

Required Scenarios

Unmarked Village Road – narrow road with mixed traffic.

Busy Urban Intersection – unsignalized intersection with informal merging.

Highway Merge – slow-moving vehicle merging into traffic.

Dense Market Area – pedestrians, vehicles, two-wheelers and pushcarts.

Sudden Cattle Crossing – animal suddenly enters the vehicle's path.

Dashboard

Display the live road view, autonomous vehicle, detected objects, object distance, predicted paths, vehicle speed, planned/replanned path, collision warnings, vehicle decision and scenario controls such as Start, Pause and Reset.

Performance Metrics

Measure:

Replanning Latency

Path Smoothness

Scenario Completion Rate

Collision-Free Performance

Obstacle Detection Accuracy

Average Response Time

Technical Architecture

Sensor Simulation → Perception → Object Detection & Tracking → Motion Prediction → Risk Assessment → Decision Making → Path Planning → Collision Checking → Vehicle Control → Vehicle Movement → Environment Update → Replanning

Expected Output

Provide a working simulation with five scenarios, perception, prediction, decision-making, adaptive path planning, collision avoidance, real-time replanning, dashboard, performance graphs and technical architecture.

The prototype should demonstrate adaptive behavior, where the vehicle detects sudden changes, evaluates risk, safely replans or stops, and continues only when the path is safe.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a83024c3-0daf-4ee9-91f7-57d1b8023206).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
