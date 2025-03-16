-- Supabase SQL Schema for Google Sheets Dialer App
-- This file contains SQL commands to set up the required database tables.

-- =============================================================================
-- Extension: UUID Generator
-- =============================================================================
-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: profiles (extends Supabase auth.users)
-- =============================================================================
-- This table extends the built-in Supabase auth.users table with additional user data
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID REFERENCES auth.users(id) PRIMARY KEY,
  "email" TEXT NOT NULL,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for the profiles table
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- Users can only read their own profile
CREATE POLICY "Users can view their own profile" 
  ON "profiles" FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON "profiles" FOR UPDATE 
  USING (auth.uid() = id);

-- =============================================================================
-- Table: leads (contains contact information synced from Google Sheets)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "leads" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "position" TEXT,
  "notes" TEXT,
  "status" TEXT DEFAULT 'new',  -- e.g., 'new', 'contacted', 'converted', 'rejected'
  "last_contacted_at" TIMESTAMP WITH TIME ZONE,
  "assigned_to" UUID REFERENCES profiles(id),
  "source" TEXT DEFAULT 'google_sheets',
  "sheet_row_id" TEXT,  -- To track the original row in Google Sheets
  "last_sync" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for the leads table
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- Authenticated users can read all leads
CREATE POLICY "Authenticated users can view leads" 
  ON "leads" FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads" 
  ON "leads" FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- Function: Set updated_at timestamp
-- =============================================================================
-- Create a function that automatically sets the updated_at column on update
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the profiles table
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Apply the trigger to the leads table
CREATE TRIGGER set_timestamp_leads
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =============================================================================
-- Trigger: Create profile on signup
-- =============================================================================
-- Create a trigger to automatically create a profile entry when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger for new user registrations
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 