# HealthAI API Documentation

Complete API reference for the HealthAI backend.

## Base URL

```
https://healthai-backend.onrender.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "status_code": 200
}
```

## Endpoints

### Authentication

#### Register Hospital
```
POST /auth/register
```

**Request:**
```json
{
  "name": "Hospital Name",
  "email": "admin@hospital.com",
  "password": "SecurePassword123",
  "state": "State Name",
  "city": "City Name"
}
```

**Response:** Hospital and admin user created

#### Login
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@hospital.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "user_id": "...",
    "email": "...",
    "role": "admin"
  }
}
```

#### Logout
```
POST /auth/logout
```

Requires authentication.

### Hospitals

#### Get Hospital
```
GET /hospitals/:hospitalId
```

**Response:**
```json
{
  "hospital_id": "...",
  "name": "Hospital Name",
  "state": "...",
  "city": "...",
  "beds": 100,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### List Hospitals
```
GET /hospitals?page=1&per_page=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

### Patients

#### Create Patient
```
POST /patients/create
```

**Request:**
```json
{
  "full_name": "John Doe",
  "phone": "+919876543210",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "aadhaar": "123456789012",
  "blood_group": "O+",
  "address": "123 Street",
  "emergency_contact": "+919876543211"
}
```

**Response:**
```json
{
  "patient_id": "PAT1234567890",
  "full_name": "John Doe",
  "aadhaar_masked": "****9012"
}
```

#### Get Patient
```
GET /patients/:patientId
```

#### List Patients
```
GET /patients?page=1&per_page=20
```

#### Update Patient
```
PUT /patients/:patientId
```

**Request:**
```json
{
  "phone": "+919876543210",
  "address": "New Address"
}
```

#### Search Patients
```
GET /patients/search?q=query
```

#### Set Patient Password
```
POST /patients/:patientId/set-password
```

**Request:**
```json
{
  "password": "SecurePassword123"
}
```

### Medical Records

#### Create Record
```
POST /records/create
```

**Request:**
```json
{
  "patient_id": "PAT1234567890",
  "record_type": "consultation",
  "title": "Initial Consultation",
  "description": "Patient presents with...",
  "department_id": "dept_id"
}
```

**Valid record_type values:**
- consultation
- prescription
- lab_report
- scan
- discharge_summary

#### Get Patient Records
```
GET /records/:patientId?page=1&per_page=20
```

#### Get Record
```
GET /records/:recordId
```

#### Download Record (PDF)
```
GET /records/:recordId/download
```

**Response:** PDF file

#### Delete Record
```
DELETE /records/:recordId
```

### Referrals

#### Create Referral
```
POST /referrals/create
```

**Request:**
```json
{
  "patient_id": "PAT1234567890",
  "to_hospital_id": "hospital_id",
  "reason": "Specialist consultation required",
  "medical_summary": "Patient diagnosed with...",
  "urgency": "routine",
  "notes": "Additional notes"
}
```

**Valid urgency values:** routine, urgent, emergency

#### Get Incoming Referrals
```
GET /referrals/incoming?page=1&per_page=20
```

#### Get Outgoing Referrals
```
GET /referrals/outgoing?page=1&per_page=20
```

#### Get Referral
```
GET /referrals/:referralId
```

#### Accept Referral
```
PUT /referrals/:referralId/accept
```

#### Reject Referral
```
PUT /referrals/:referralId/reject
```

**Request:**
```json
{
  "rejection_reason": "Cannot handle this case"
}
```

### Permissions

#### Set User Permissions
```
POST /permissions/users/:userId/set
```

**Request:**
```json
{
  "resource_type": "patients",
  "access_level": "edit",
  "permissions": {
    "read": true,
    "write": true,
    "execute": false,
    "delete": false
  }
}
```

#### Get User Permissions
```
GET /permissions/users/:userId/get
```

#### Check Permission
```
POST /permissions/check
```

**Request:**
```json
{
  "resource_type": "patients",
  "required_permission": "read"
}
```

#### Grant Cross-Hospital Access
```
POST /permissions/grant-cross-hospital
```

**Request:**
```json
{
  "hospital_id": "hospital_id"
}
```

### AI Features

#### Summarize Medical Record
```
POST /ai/summarize-record/:recordId
```

**Response:**
```json
{
  "record_id": "...",
  "summary": "AI-generated summary"
}
```

#### Get Health Insights
```
GET /ai/health-insights/:patientId
```

**Response:**
```json
{
  "health_trend": "stable",
  "key_concerns": [...],
  "lifestyle_recommendations": [...],
  "suggested_tests": [...],
  "generated_at": "2024-01-01T00:00:00Z"
}
```

#### Search Records (NLP)
```
POST /ai/search-records
```

**Request:**
```json
{
  "patient_id": "PAT1234567890",
  "query": "search terms"
}
```

#### Predict Health Risks
```
GET /ai/predict-risks/:patientId
```

**Response:**
```json
{
  "risk_assessment": [...],
  "overall_risk_level": "moderate",
  "generated_at": "2024-01-01T00:00:00Z"
}
```

#### Get Health Status
```
GET /ai/health-status/:patientId
```

**Complete health overview with insights and risks**

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields",
  "error_code": "MISSING_FIELDS",
  "status_code": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error_code": "UNAUTHORIZED",
  "status_code": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error_code": "FORBIDDEN",
  "status_code": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error_code": "NOT_FOUND",
  "status_code": 404
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error_code": "INTERNAL_ERROR",
  "status_code": 500
}
```

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Data Types

- **Date**: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **Phone**: E.164 format (+91...)
- **Aadhaar**: 12 digits (encrypted in database)
- **ObjectId**: MongoDB 24-character hex string

## Testing with cURL

### Example: Login
```bash
curl -X POST https://healthai-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@centralmedical.in",
    "password": "Password@123"
  }'
```

### Example: Create Patient
```bash
curl -X POST https://healthai-backend.onrender.com/api/patients/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "John Doe",
    "phone": "+919876543210",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "aadhaar": "123456789012"
  }'
```

## SDK/Client Libraries

Frontend SDK available in `frontend/src/services/api.js`

Example usage:
```javascript
import { patientsAPI } from './services/api';

// Create patient
const response = await patientsAPI.createPatient({
  full_name: "John Doe",
  phone: "+919876543210",
  date_of_birth: "1990-01-01",
  gender: "male",
  aadhaar: "123456789012"
});
```

---

For more information, see [README.md](README.md)
