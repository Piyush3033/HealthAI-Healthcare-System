#!/usr/bin/env python
"""Initialize database with sample data"""

import os
from datetime import datetime
from app.database import Database
from app.utils import PasswordHash
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

def init_database():
    """Initialize database with collections and indexes"""
    
    # Initialize database connection
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://admin:admin@localhost:27017/healthai?authSource=admin')
    Database.initialize(mongodb_uri)
    db = Database.get_db()
    
    print("Initializing HealthAI Database...")
    
    # Clear existing collections
    collections = [
        'hospitals', 'users', 'patients', 'departments', 'patient_records',
        'appointments', 'doctors_schedules', 'referrals', 'audit_logs',
        'notifications', 'user_permissions'
    ]
    
    for collection in collections:
        db[collection].delete_many({})
    
    print("✓ Cleared existing collections")
    
    # Create sample hospitals
    hospital1 = {
        'hospital_name': 'Central Medical Center',
        'address': '123 Medical Lane',
        'city': 'New Delhi',
        'state': 'Delhi',
        'pincode': '110001',
        'phone': '+91-11-12345678',
        'email': 'contact@centralmedical.in',
        'website': 'www.centralmedical.in',
        'bed_count': 500,
        'established_year': 2000,
        'status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    hospital2 = {
        'hospital_name': 'City Hospital',
        'address': '456 Health Street',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001',
        'phone': '+91-22-87654321',
        'email': 'contact@cityhospital.in',
        'website': 'www.cityhospital.in',
        'bed_count': 300,
        'established_year': 2010,
        'status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    hospitals = db.hospitals.insert_many([hospital1, hospital2])
    hospital1_id, hospital2_id = hospitals.inserted_ids
    
    print(f"✓ Created 2 sample hospitals")
    
    # Create sample departments
    dept_data = [
        {'name': 'Cardiology', 'code': 'CARD', 'hospital_id': hospital1_id},
        {'name': 'Orthopedics', 'code': 'ORTHO', 'hospital_id': hospital1_id},
        {'name': 'Pediatrics', 'code': 'PED', 'hospital_id': hospital2_id},
    ]
    
    departments = []
    for dept in dept_data:
        department_doc = {
            'hospital_id': dept['hospital_id'],
            'department_name': dept['name'],
            'department_code': dept['code'],
            'description': f"{dept['name']} Department",
            'head_doctor_id': None,
            'active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = db.departments.insert_one(department_doc)
        departments.append(result.inserted_id)
    
    print(f"✓ Created 3 sample departments")
    
    # Create sample users (doctors, staff, admins)
    users = [
        {
            'email': 'admin@centralmedical.in',
            'password_hash': PasswordHash.hash_password('Password@123'),
            'full_name': 'Dr. Rajesh Kumar',
            'phone': '+91-9876543210',
            'role': 'admin',
            'hospital_id': hospital1_id,
            'department_id': None,
            'specialization': None,
            'license_number': None,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        },
        {
            'email': 'doctor1@centralmedical.in',
            'password_hash': PasswordHash.hash_password('Password@123'),
            'full_name': 'Dr. Priya Sharma',
            'phone': '+91-9876543211',
            'role': 'doctor',
            'hospital_id': hospital1_id,
            'department_id': departments[0],
            'specialization': 'Cardiologist',
            'license_number': 'MED123456',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        },
        {
            'email': 'staff1@centralmedical.in',
            'password_hash': PasswordHash.hash_password('Password@123'),
            'full_name': 'Nurse John Smith',
            'phone': '+91-9876543212',
            'role': 'staff',
            'hospital_id': hospital1_id,
            'department_id': None,
            'specialization': None,
            'license_number': None,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        }
    ]
    
    user_results = db.users.insert_many(users)
    print(f"✓ Created {len(users)} sample users")
    
    # Create sample patients
    patients = [
        {
            'patient_id': 'PAT001',
            'hospital_id': hospital1_id,
            'full_name': 'Rajesh Singh',
            'email': 'rajesh@email.com',
            'password_hash': PasswordHash.hash_password('Patient@123'),
            'phone': '+91-9876543220',
            'date_of_birth': '1985-05-15',
            'gender': 'male',
            'blood_group': 'O+',
            'aadhaar_encrypted': 'encrypted_aadhaar_12345678',
            'aadhaar_hash': 'hash_12345678',
            'aadhaar_masked': 'XXXX-XXXX-5678',
            'address': '123 Main Street',
            'emergency_contact': '+91-9876543221',
            'insurance_provider': 'HDFC',
            'insurance_number': 'HDFC123456',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        }
    ]
    
    patient_results = db.patients.insert_many(patients)
    print(f"✓ Created {len(patients)} sample patients")
    
    print("\n✓ Database initialization complete!")
    print(f"\nSample Credentials:")
    print(f"Admin: admin@centralmedical.in / Password@123")
    print(f"Doctor: doctor1@centralmedical.in / Password@123")
    print(f"Staff: staff1@centralmedical.in / Password@123")
    print(f"Patient: rajesh@email.com / Patient@123")


if __name__ == '__main__':
    init_database()
