-- PostgreSQL Database Setup for LMS Platform
-- Run this script as postgres user: sudo -u postgres psql < setup-db.sql

-- Create the database user
CREATE USER lmsuser WITH PASSWORD 'lmspassword123';

-- Create the database
CREATE DATABASE lms_database OWNER lmsuser;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE lms_database TO lmsuser;

-- Connect to the database and set up permissions
\c lms_database;
GRANT ALL ON SCHEMA public TO lmsuser;