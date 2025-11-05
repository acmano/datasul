# Chaos Engineering Guide

## Table of Contents

- [What is Chaos Engineering?](#what-is-chaos-engineering)
- [Safety & Production Rules](#safety--production-rules)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Predefined Experiments](#predefined-experiments)
- [Creating Custom Experiments](#creating-custom-experiments)
- [Best Practices](#best-practices)
- [Interpreting Results](#interpreting-results)
- [Troubleshooting](#troubleshooting)

## What is Chaos Engineering?

Chaos Engineering is the discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions in production.

**LordtsAPI Chaos Engineering** allows you to:
- Inject controlled failures (latency, timeouts, errors)
- Validate retry mechanisms work correctly
- Test circuit breaker behavior
- Verify connection pool management
- Ensure alerting systems fire appropriately
- Build confidence in system resilience

## Safety & Production Rules

### 🚨 CRITICAL SAFETY RULES

**NEVER enable Chaos Engineering in production by default!**

1. **Production Protection**
   - Chaos is blocked in production by default
   - Requires explicit `CHAOS_PRODUCTION_OVERRIDE=true` to enable
   - Always log chaos activities
   - Respect schedule and target configuration

2. **Environment Variables**
   ```bash
   # .env
   CHAOS_ENABLED=false  # Default: false
   CHAOS_SAFE_MODE=true  # Requires confirmation for high-probability chaos

   # DANGER: Only set if you REALLY know what you're doing
   # CHAOS_PRODUCTION_OVERRIDE=true
   ```

3. **Safe Mode**
   - When `CHAOS_SAFE_MODE=true`, experiments with probability > 50% require confirmation
   - Prevents accidental high-impact chaos

4. **Production Override**
   ```typescript
   // Production check in code
   if (process.env.NODE_ENV === 'production' &&
       !process.env.CHAOS_PRODUCTION_OVERRIDE) {
     throw new Error('CHAOS BLOCKED IN PRODUCTION');
   }
   ```

## Quick Start

### 1. Enable Chaos Engineering

```bash
# .env
NODE_ENV=development  # Not production!
CHAOS_ENABLED=true
```

### 2. Start Predefined Experiment

```bash
# Via API
curl -X POST http://localhost:3000/api/chaos/templates/testRetry/start

# Or via CLI (coming soon)
npm run chaos -- start testRetry
```

### 3. Monitor Results

```bash
# Get statistics
curl http://localhost:3000/api/chaos/stats

# Response:
{
  "success": true,
  "data": {
    "testRetry": {
      "totalCalls": 100,
      "chaosInjected": 50,
      "failuresInjected": 30,
      "latencyInjected": 0
    }
  }
}
```

### 4. Stop Experiment

```bash
curl -X DELETE http://localhost:3000/api/chaos/experiments/testRetry
```

## API Reference

### Base URL

```
http://localhost:3000/api/chaos
```

### Endpoints

#### Create Experiment

```http
POST /api/chaos/experiments
Content-Type: application/json

{
  "name": "my-latency-test",
  "config": {
    "enabled": true,
    "type": "latency",
    "probability": 0.3,
    "minLatencyMs": 1000,
    "maxLatencyMs": 3000,
    "targetConnections": ["DtsPrdEmp"]
  }
}
```

#### List Active Experiments

```http
GET /api/chaos/experiments

Response:
{
  "success": true,
  "data": {
    "experiments": ["testRetry", "my-latency-test"],
    "count": 2,
    "isEnabled": true
  }
}
```

#### Stop Experiment

```http
DELETE /api/chaos/experiments/my-latency-test
```

#### Get Statistics

```http
GET /api/chaos/stats
GET /api/chaos/stats/my-latency-test
```

#### Reset Statistics

```http
POST /api/chaos/stats/reset
POST /api/chaos/stats/reset/my-latency-test
```

#### List Templates

```http
GET /api/chaos/templates

Response:
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "testRetry",
        "config": { ... }
      },
      ...
    ],
    "count": 8
  }
}
```

#### Start Template

```http
POST /api/chaos/templates/testRetry/start
```

#### Stop All

```http
POST /api/chaos/stop-all
```

## Predefined Experiments

### 1. testRetry

**Purpose:** Validate retry logic

```json
{
  "type": "intermittent",
  "probability": 0.5,
  "failureRate": 0.6,
  "targetConnections": ["DtsPrdEmp"]
}
```

**Expected Behavior:**
- 50% of queries intercepted
- 60% of those fail
- System should retry and eventually succeed
- Retry count should increase in metrics

**How to Run:**
```bash
curl -X POST http://localhost:3000/api/chaos/templates/testRetry/start
```

**Validation:**
- Check retry metrics: `GET /metrics` (look for `db_retry_attempts`)
- Check logs for retry messages
- Verify queries eventually succeed

---

### 2. testCircuitBreaker

**Purpose:** Force circuit breaker to open

```json
{
  "type": "error",
  "probability": 1.0,
  "errorTypes": ["ETIMEDOUT"],
  "targetConnections": ["PCF4_PRD"]
}
```

**Expected Behavior:**
- All queries fail with ETIMEDOUT
- Circuit breaker should open after threshold (default: 5 failures)
- Subsequent queries fail fast
- After timeout (60s), circuit moves to HALF_OPEN
- Successful query closes circuit

**How to Run:**
```bash
curl -X POST http://localhost:3000/api/chaos/templates/testCircuitBreaker/start

# Make some queries to trigger failures
for i in {1..10}; do
  curl http://localhost:3000/api/item/dadosCadastrais/informacoesGerais/7530110
  sleep 1
done

# Check circuit breaker state
curl http://localhost:3000/metrics | grep circuit_breaker
```

**Validation:**
- Circuit breaker opens: `circuit_breaker_state{connection="PCF4_PRD"} 1` (OPEN)
- Failures increase: `circuit_breaker_failures_total`
- After timeout, state moves to HALF_OPEN (value 2)

---

### 3. testLatency

**Purpose:** Test latency tolerance

```json
{
  "type": "latency",
  "probability": 0.3,
  "minLatencyMs": 1000,
  "maxLatencyMs": 3000,
  "targetConnections": ["all"]
}
```

**Expected Behavior:**
- 30% of queries have 1-3 second latency
- System handles slow responses gracefully
- No timeouts (latency < request timeout)
- P95/P99 latency increases but system remains stable

**How to Run:**
```bash
curl -X POST http://localhost:3000/api/chaos/templates/testLatency/start

# Make queries and monitor latency
for i in {1..50}; do
  time curl http://localhost:3000/api/item/dadosCadastrais/informacoesGerais/7530110
done

# Check metrics
curl http://localhost:3000/metrics | grep query_duration
```

**Validation:**
- P95 latency increases to ~3 seconds
- No timeout errors
- System remains responsive

---

### 4. businessHoursChaos

**Purpose:** Low-level chaos during business hours

```json
{
  "type": "intermittent",
  "probability": 0.1,
  "failureRate": 0.2,
  "schedule": {
    "startTime": "09:00",
    "endTime": "18:00",
    "daysOfWeek": [1, 2, 3, 4, 5]
  }
}
```

**Expected Behavior:**
- Only runs Mon-Fri, 9am-6pm
- 10% of queries intercepted
- 20% of those fail
- Minimal impact on system
- Validates gradual degradation handling

---

### 5. testPoolExhaustion

**Purpose:** Test connection pool management

```json
{
  "type": "pool_exhaustion",
  "probability": 0.1,
  "targetConnections": ["DtsPrdEmp"]
}
```

**Expected Behavior:**
- Some connections held for 30 seconds
- Pool may become exhausted
- New queries wait or fail gracefully
- Pool recovers after connections released

**How to Run:**
```bash
curl -X POST http://localhost:3000/api/chaos/templates/testPoolExhaustion/start

# Flood with requests
for i in {1..20}; do
  curl http://localhost:3000/api/item/dadosCadastrais/informacoesGerais/7530110 &
done

# Check pool metrics
curl http://localhost:3000/metrics | grep pool
```

**Validation:**
- Pool size increases: `db_pool_active`
- Some queries wait: check latency
- System doesn't crash
- Pool recovers after chaos stops

---

### 6. testIntermittent

**Purpose:** Simulate flaky connection

```json
{
  "type": "intermittent",
  "probability": 1.0,
  "failureRate": 0.4,
  "targetConnections": ["DtsTstEmp"]
}
```

**Expected Behavior:**
- 40% of queries fail randomly
- Retry logic handles failures
- Circuit breaker may open briefly
- System remains stable

---

### 7. testSlowQueries

**Purpose:** Test slow query handling

```json
{
  "type": "slow_query",
  "probability": 0.5,
  "minLatencyMs": 2000,
  "maxLatencyMs": 5000,
  "targetConnections": ["all"]
}
```

**Expected Behavior:**
- 50% of queries take 2-5 seconds
- Timeouts may trigger
- No deadlocks
- System handles backpressure

---

### 8. testErrorHandling

**Purpose:** Test various error types

```json
{
  "type": "error",
  "probability": 0.3,
  "errorTypes": ["ETIMEDOUT", "ECONNREFUSED", "ECONNRESET"],
  "targetConnections": ["all"]
}
```

**Expected Behavior:**
- Various network errors injected
- Proper error logging
- Retries triggered
- User-friendly error messages

## Creating Custom Experiments

### Example: Test Timeout on Specific Endpoint

```typescript
import { chaosInjector, ChaosType } from '@infrastructure/chaos/ChaosInjector';

// Custom experiment
const config = {
  enabled: true,
  type: ChaosType.TIMEOUT,
  probability: 0.5,  // 50% of queries
  targetConnections: ['DtsPrdEmp'],
  schedule: {
    startTime: '14:00',  // 2pm
    endTime: '15:00',    // 3pm
    daysOfWeek: [1, 2, 3, 4, 5]  // Weekdays only
  }
};

chaosInjector.registerExperiment('afternoon-timeouts', config);

// Run for 1 hour, then stop
setTimeout(() => {
  chaosInjector.unregisterExperiment('afternoon-timeouts');
}, 60 * 60 * 1000);
```

### Example: Progressive Failure Rate

```typescript
// Start with low failure rate, increase over time
const startExperiment = async () => {
  for (let rate = 0.1; rate <= 0.9; rate += 0.1) {
    console.log(`Testing with ${rate * 100}% failure rate`);

    const config = {
      enabled: true,
      type: ChaosType.INTERMITTENT,
      probability: 1.0,
      failureRate: rate,
      targetConnections: ['DtsTstEmp']
    };

    chaosInjector.registerExperiment('progressive-test', config);

    // Run for 5 minutes
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

    chaosInjector.unregisterExperiment('progressive-test');
  }
};
```

## Best Practices

### 1. Start Small

```bash
# ✅ Good: Low probability, specific target
{
  "probability": 0.1,
  "targetConnections": ["DtsTstEmp"]
}

# ❌ Bad: High probability, all connections
{
  "probability": 1.0,
  "targetConnections": ["all"]
}
```

### 2. Monitor Metrics

Always watch:
- `db_retry_attempts_total` - Retry count
- `circuit_breaker_state` - Circuit breaker status
- `db_query_duration_seconds` - Query latency
- `db_errors_total` - Error count

### 3. Use Schedules

```json
{
  "schedule": {
    "startTime": "22:00",  // Off-hours
    "endTime": "06:00",
    "daysOfWeek": [0, 6]   // Weekends
  }
}
```

### 4. Test One Thing at a Time

```bash
# ✅ Good: Test retry logic
testRetry

# ❌ Bad: Test everything at once
testRetry + testLatency + testCircuitBreaker
```

### 5. Document Your Experiments

```typescript
// experiments.ts
export const myCustomTest: ChaosConfig = {
  enabled: false,
  type: ChaosType.LATENCY,
  probability: 0.3,
  minLatencyMs: 500,
  maxLatencyMs: 1500,

  // 📝 DOCUMENT EXPECTED BEHAVIOR
  // Expected: P95 latency increases to ~1.5s
  // Expected: No timeouts
  // Expected: System remains stable
  // Validates: Latency tolerance under load
};
```

## Interpreting Results

### Retry Validation

**Expected:**
```
Chaos Statistics:
  totalCalls: 100
  chaosInjected: 50
  failuresInjected: 30

Retry Metrics:
  db_retry_attempts_total: 30
  db_retry_success_total: 30
```

**Interpretation:**
- ✅ Retry working: All 30 failures were retried and succeeded
- ❌ Retry broken: Success count < failure count

---

### Circuit Breaker Validation

**Expected:**
```
Circuit Breaker State:
  CLOSED → OPEN (after 5 failures)
  OPEN → HALF_OPEN (after 60s)
  HALF_OPEN → CLOSED (after success)

Metrics:
  circuit_breaker_failures_total: 5
  circuit_breaker_state: 0 (CLOSED)
```

**Interpretation:**
- ✅ Circuit working: State transitions correctly
- ❌ Circuit broken: Stays CLOSED despite failures

---

### Latency Tolerance

**Expected:**
```
Query Duration Percentiles:
  P50: 50ms
  P95: 3000ms (chaos latency)
  P99: 3000ms

No timeout errors
```

**Interpretation:**
- ✅ System tolerates latency: No cascading failures
- ❌ System fragile: Timeouts, deadlocks, or crashes

## Troubleshooting

### Chaos Not Working

**Problem:** Experiments registered but no chaos injected

**Solution:**
```bash
# Check if chaos is enabled
curl http://localhost:3000/api/chaos/experiments

# Verify probability
# If probability=0.1, only 10% of queries affected

# Check target connections
# Ensure connection name matches (e.g., 'DtsPrdEmp')
```

### Too Much Chaos

**Problem:** System overwhelmed

**Solution:**
```bash
# Stop all experiments immediately
curl -X POST http://localhost:3000/api/chaos/stop-all

# Reduce probability
{
  "probability": 0.05  // 5% instead of 50%
}

# Target specific connection only
{
  "targetConnections": ["DtsTstEmp"]  // Test only
}
```

### Experiments Not Respecting Schedule

**Problem:** Chaos injected outside scheduled time

**Solution:**
```typescript
// Check timezone
const now = new Date();
console.log(now.getHours());  // Should match your timezone

// Schedule uses server time (24-hour format)
{
  "startTime": "14:00",  // 2pm server time
  "endTime": "16:00"     // 4pm server time
}
```

### Production Accidentally Enabled

**Problem:** Chaos running in production!

**Solution:**
```bash
# IMMEDIATE: Stop all
curl -X POST http://production-server:3000/api/chaos/stop-all

# Remove production override
unset CHAOS_PRODUCTION_OVERRIDE

# Restart server
pm2 restart lordtsapi
```

## Example Workflow

### Full Resilience Test

```bash
#!/bin/bash
# test-resilience.sh

echo "Starting Resilience Tests..."

# 1. Test Retry
echo "Test 1: Retry Logic"
curl -X POST http://localhost:3000/api/chaos/templates/testRetry/start
sleep 300  # 5 minutes
curl -X DELETE http://localhost:3000/api/chaos/experiments/testRetry

# 2. Test Circuit Breaker
echo "Test 2: Circuit Breaker"
curl -X POST http://localhost:3000/api/chaos/templates/testCircuitBreaker/start
sleep 300
curl -X DELETE http://localhost:3000/api/chaos/experiments/testCircuitBreaker

# 3. Test Latency
echo "Test 3: Latency Tolerance"
curl -X POST http://localhost:3000/api/chaos/templates/testLatency/start
sleep 300
curl -X DELETE http://localhost:3000/api/chaos/experiments/testLatency

# 4. Get Results
echo "Results:"
curl http://localhost:3000/api/chaos/stats

echo "Done! Check logs and metrics for details."
```

## References

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/)
- [AWS Fault Injection Simulator](https://aws.amazon.com/fis/)
- [Gremlin Chaos Engineering](https://www.gremlin.com/chaos-engineering/)
