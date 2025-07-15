# TTL Emergency Notification System - Implementation Complete

## 🎯 Complete Implementation Summary

The **TTL (Time To Live) Emergency Notification System** has been fully implemented with all requested features:

### ✅ Core Features Implemented

1. **✅ 1-Hour TTL per Batch**: Each batch of 2 responders gets exactly 1 hour to respond
2. **✅ Batch Size of 2**: Send invitations in batches of 2 responders at a time
3. **✅ 10-Responder Limit**: Maximum 10 responders will be notified per alert
4. **✅ Automatic Batch Progression**: After 1 hour expires, automatically send to next 2 responders
5. **✅ Distance-Based Ordering**: Responders sorted by distance from emergency location
6. **✅ Acceptance Cancellation**: When one responder accepts, all other invitations are cancelled
7. **✅ Database Tracking**: Complete tracking of batches, expiration times, and alert references

## 🏗️ Technical Implementation

### **Database Schema Updates**

```sql
-- Added TTL fields to notifications table
ALTER TABLE notifications
ADD COLUMN expires_at TIMESTAMP NULL,
ADD COLUMN batch_number INT NULL,
ADD COLUMN alert_id VARCHAR(36) NULL;

-- Performance indexes
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX idx_notifications_batch_number ON notifications(batch_number);
```

### **Entity Enhancements**

```java
@Entity
public class Notification {
    // ...existing fields...

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "batch_number")
    private Integer batchNumber;

    @Column(name = "alert_id")
    private UUID alertId;

    // TTL helper methods
    public boolean isExpired() { ... }
    public void setTTL(Duration ttl) { ... }
}
```

### **Service Layer Logic**

```java
@Service
public class NotificationService {
    private static final Duration EMERGENCY_TTL = Duration.ofHours(1); // 1 hour TTL
    private static final int BATCH_SIZE = 2; // 2 responders per batch
    private static final int MAX_RESPONDERS = 10; // Maximum per alert

    // Complete TTL batch processing implementation
    public void sendEmergencyBatch(...) { ... }
    public void scheduleExpirationCheck(...) { ... }
    public void handleResponderAcceptance(...) { ... }
}
```

### **REST API Endpoints**

```java
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    // Accept emergency response (stops TTL for alert)
    @PostMapping("/accept-emergency")
    public ResponseEntity<?> acceptEmergencyResponse(...) { ... }
}
```

## 🔄 Complete TTL Flow

### **Step 1: SOS Alert Triggered**

```http
POST /api/sos/voice-command
# Automatically triggers TTL process
```

### **Step 2: Batch 1 Notifications Sent**

- ✅ Find all active responders
- ✅ Sort by distance from emergency location
- ✅ Send to nearest 2 responders
- ✅ Set 1-hour TTL on each notification
- ✅ Start automatic expiration timer

### **Step 3: TTL Expiration (After 1 Hour)**

- ✅ System automatically checks if batch 1 expired
- ✅ Mark expired notifications as FAILED
- ✅ Send to next 2 nearest responders (Batch 2)
- ✅ Start new 1-hour TTL timer

### **Step 4: Process Continues**

- ✅ Up to 5 batches maximum (10 responders total)
- ✅ Each batch gets 1-hour TTL independently
- ✅ Process stops when someone accepts or 10 responders reached

### **Step 5: Responder Acceptance**

```http
POST /api/notifications/accept-emergency
{
    "alertId": "uuid",
    "alertUserId": "uuid",
    "responderName": "John Responder"
}
```

- ✅ Immediately cancels all other pending invitations
- ✅ Stops TTL process for this alert
- ✅ Sends "Emergency Accepted" notification to original user

## 📊 Key Constraints & Limits

| Constraint           | Value             | Purpose                                    |
| -------------------- | ----------------- | ------------------------------------------ |
| **TTL Duration**     | 1 hour            | Reasonable response window                 |
| **Batch Size**       | 2 responders      | Balance response time vs resources         |
| **Max Responders**   | 10 per alert      | Prevent spam and resource exhaustion       |
| **Max Batches**      | 5 (10÷2)          | Natural limit from max responders          |
| **Distance Sorting** | Haversine formula | Always invite closest available responders |

## 🔧 Configuration Constants

```java
// All configurable in NotificationService
private static final Duration EMERGENCY_TTL = Duration.ofHours(1);
private static final int BATCH_SIZE = 2;
private static final int MAX_RESPONDERS = 10;
```

## 🧪 Testing Coverage

### **TTL Test Scenarios**

1. ✅ **Basic TTL Flow**: SOS → Batch 1 → Wait 1h → Batch 2
2. ✅ **Early Acceptance**: Responder accepts before TTL expires
3. ✅ **Max Responder Limit**: Process stops at 10 responders
4. ✅ **Multiple Concurrent Alerts**: Independent TTL processes
5. ✅ **Edge Cases**: No responders, all responders offline

### **Test File Created**

- 📁 `endpoints/notification_ttl_test.http` - Complete TTL testing scenarios

## 📈 Performance Optimizations

### **Database Indexes**

- ✅ `idx_notifications_expires_at` - Fast TTL expiration queries
- ✅ `idx_notifications_alert_id` - Quick alert-based lookups
- ✅ `idx_notifications_batch_number` - Efficient batch tracking
- ✅ `idx_notifications_alert_type_status` - Combined query optimization

### **Async Processing**

- ✅ TTL timers run in background threads
- ✅ Email sending is asynchronous
- ✅ Batch processing doesn't block SOS response
- ✅ Multiple TTL processes run independently

## 🛡️ Error Handling & Resilience

### **Graceful Degradation**

- ✅ If no responders available, logs warning but doesn't fail
- ✅ If email sending fails, TTL process continues
- ✅ Thread interruptions handled properly
- ✅ Database errors don't stop emergency processing

### **Monitoring & Logging**

```java
log.info("Sending emergency batch {} to {} responders for alert: {}",
    batchNumber, batchResponders.size(), alert.getId());

log.info("Batch {} expired for alert {}, sending to next batch",
    batchNumber, alert.getId());

log.info("Responder {} accepted alert {}, cancelled {} other pending invitations",
    responderId, alertId, pendingNotifications.size() - 1);
```

## 🔗 Integration Points

### **SOS Service Integration**

- ✅ All SOS methods (`voiceCommand`, `textCommand`, `fileUpload`) automatically trigger TTL
- ✅ No changes needed to existing SOS logic
- ✅ TTL runs in parallel to SOS processing

### **Email Service Integration**

- ✅ Trusted contacts still get immediate emergency emails
- ✅ Responders get in-app notifications with TTL
- ✅ Emergency acceptance triggers confirmation emails

### **Database Consistency**

- ✅ All TTL operations are transactional
- ✅ Batch tracking maintains referential integrity
- ✅ Status updates are atomic

## 🚀 Production Readiness

### **Deployment Requirements**

1. ✅ Run database migration: `notifications_ttl_migration.sql`
2. ✅ No configuration changes needed (uses existing SMTP, database)
3. ✅ Thread pool handles concurrent TTL processes
4. ✅ All existing functionality preserved

### **Monitoring Recommendations**

- Monitor TTL process completion rates
- Track average batch progression times
- Alert on excessive responder notification counts
- Monitor database performance for TTL queries

---

## 🎯 **The TTL system is now COMPLETE and ready for production!**

When you trigger an SOS alert, the system will:

1. **Immediately** send emails to trusted contacts
2. **Automatically** start TTL batch process for responders
3. **Send to 2 nearest responders** with 1-hour deadline
4. **Progress through batches** until someone accepts or 10 responders reached
5. **Stop TTL process** when emergency is accepted
6. **Handle everything asynchronously** without blocking the emergency response

The implementation follows your exact requirements:

- ✅ "Send invitations in batches of 2"
- ✅ "Each with a short TTL (e.g., 1 h)"
- ✅ "Not more than 10 responder will receive"
- ✅ "Automatically send to the next in queue" when TTL expires
- ✅ "Always inviting the closest available responders"
