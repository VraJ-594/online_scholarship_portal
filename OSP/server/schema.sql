-- ============================================================
-- OSP - Online Scholarship Portal
-- Clean PostgreSQL schema for local restoration
-- ============================================================

DROP SCHEMA IF EXISTS osp CASCADE;

CREATE SCHEMA osp;

SET search_path TO osp;

-- ============================================================
-- 1. STATES
-- ============================================================

CREATE TABLE states (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- 2. DISTRICTS
-- ============================================================

CREATE TABLE districts (
    district_id SERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    state_id INTEGER NOT NULL
        REFERENCES states(state_id),
    UNIQUE (district_name, state_id)
);

-- ============================================================
-- 3. ADDRESSES
-- ============================================================

CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    street_address TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    district_id INTEGER NOT NULL
        REFERENCES districts(district_id)
);

-- ============================================================
-- 4. SCHOLARSHIPS
-- ============================================================

CREATE TABLE scholarships (
    scholarship_id SERIAL PRIMARY KEY,
    scholarship_name VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    start_date DATE,
    end_date DATE NOT NULL,
    description TEXT NOT NULL,
    education_level VARCHAR(100) NOT NULL,
    eligible_courses TEXT NOT NULL,
    min_percentage NUMERIC NOT NULL CHECK (min_percentage >= 0),
    annual_family_income INTEGER NOT NULL CHECK (annual_family_income >= 0),
    benefits TEXT,
    note TEXT
);

-- ============================================================
-- 5. IFSC DETAILS
-- ============================================================

CREATE TABLE ifsc_details (
    ifsc_code CHAR(11) PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL
);

-- ============================================================
-- 6. BANK DETAILS
-- ============================================================

CREATE TABLE bank_details (
    bank_account_no VARCHAR(30) PRIMARY KEY,
    ifsc_code CHAR(11) NOT NULL
        REFERENCES ifsc_details(ifsc_code)
);

-- ============================================================
-- 7. DEPARTMENTS / PROGRAMS
-- ============================================================

CREATE TABLE departments_with_programs (
    department_name VARCHAR(63) PRIMARY KEY,
    program_name VARCHAR(63) NOT NULL
);

-- ============================================================
-- 8. EDUCATION DETAILS
-- ============================================================

CREATE TABLE education_details (
    college_id SERIAL PRIMARY KEY,
    department_name VARCHAR(63) NOT NULL
        REFERENCES departments_with_programs(department_name),
    tuition_fees INTEGER NOT NULL CHECK (tuition_fees >= 0),
    non_tuition_fees INTEGER NOT NULL CHECK (non_tuition_fees >= 0)
);

-- ============================================================
-- 9. USERS
-- ============================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('student', 'admin')),
    pic TEXT
);

-- ============================================================
-- 10. APPLICANTS
-- ============================================================

CREATE TABLE applicants (
    applicant_id SERIAL PRIMARY KEY,

    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,

    dob VARCHAR(255) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE
        REFERENCES users(email),

    mobile_number VARCHAR(15) NOT NULL,

    parent_name VARCHAR(255) NOT NULL,
    occupation VARCHAR(100),
    income VARCHAR(100) NOT NULL,
    parent_mobile VARCHAR(15),

    current_semester VARCHAR(10) NOT NULL,
    year_of_admission CHAR(4) NOT NULL,

    current_cgpa_obtained VARCHAR(10) NOT NULL,
    current_cgpa_total VARCHAR(10) NOT NULL,

    address_id INTEGER NOT NULL
        REFERENCES addresses(address_id),

    bank_account_no VARCHAR(30) NOT NULL
        REFERENCES bank_details(bank_account_no),

    college_id INTEGER NOT NULL
        REFERENCES education_details(college_id)
);

-- ============================================================
-- 11. CLASS 10 DETAILS
-- ============================================================

CREATE TABLE class10_details (
    class10_id SERIAL PRIMARY KEY,

    applicant_id INTEGER NOT NULL UNIQUE
        REFERENCES applicants(applicant_id),

    institute_name VARCHAR(255) NOT NULL,
    passing_date VARCHAR(10) NOT NULL,
    marks_obtained INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,

    CHECK (marks_obtained >= 0),
    CHECK (total_marks > 0),
    CHECK (marks_obtained <= total_marks)
);

-- ============================================================
-- 12. CLASS 12 DETAILS
-- ============================================================

CREATE TABLE class12_details (
    class12_id SERIAL PRIMARY KEY,

    applicant_id INTEGER NOT NULL UNIQUE
        REFERENCES applicants(applicant_id),

    institute_name VARCHAR(255) NOT NULL,
    passing_date VARCHAR(10) NOT NULL,
    marks_obtained INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,

    CHECK (marks_obtained >= 0),
    CHECK (total_marks > 0),
    CHECK (marks_obtained <= total_marks)
);

-- ============================================================
-- 13. APPLICANT DOCUMENTS
-- ============================================================

CREATE TABLE applicant_documents (
    email VARCHAR(255) PRIMARY KEY
        REFERENCES users(email),

    income_certificate VARCHAR(255),
    bank_passbook VARCHAR(255),
    aadhar_card VARCHAR(255),
    tuition_fee_receipt VARCHAR(255),
    non_tuition_fee_receipt VARCHAR(255),
    class_10_mark_sheet VARCHAR(255),
    class_12_mark_sheet VARCHAR(255),
    current_education_mark_sheet VARCHAR(255)
);

-- ============================================================
-- 14. APPLICATIONS
-- ============================================================

CREATE TABLE applied_in (
    scholarship_id INTEGER NOT NULL
        REFERENCES scholarships(scholarship_id)
        ON DELETE CASCADE,

    applicant_id INTEGER NOT NULL
        REFERENCES applicants(applicant_id)
        ON DELETE CASCADE,

    applied_date DATE NOT NULL,
    status TEXT NOT NULL
        CHECK (
            status IN (
                'Pending',
                'Under Review',
                'Documents Verified',
                'Accepted',
                'Rejected'
            )
        ),

    PRIMARY KEY (scholarship_id, applicant_id)
);

-- ============================================================
-- 15. RECEIVED FROM
-- ============================================================

CREATE TABLE received_from (
    scholarship_id INTEGER NOT NULL
        REFERENCES scholarships(scholarship_id)
        ON DELETE CASCADE,

    applicant_id INTEGER NOT NULL
        REFERENCES applicants(applicant_id)
        ON DELETE CASCADE,

    amount_received INTEGER NOT NULL
        CHECK (amount_received > 0),

    received_date DATE NOT NULL,

    PRIMARY KEY (scholarship_id, applicant_id)
);

-- ============================================================
-- 16. FORGOT PASSWORD
-- ============================================================

CREATE TABLE forgot_pass (
    email VARCHAR(255) PRIMARY KEY
        REFERENCES users(email)
        ON DELETE CASCADE,

    otp VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_districts_state_id
    ON districts(state_id);

CREATE INDEX idx_addresses_district_id
    ON addresses(district_id);

CREATE INDEX idx_bank_details_ifsc_code
    ON bank_details(ifsc_code);

CREATE INDEX idx_applicants_email
    ON applicants(email);

CREATE INDEX idx_applicants_address_id
    ON applicants(address_id);

CREATE INDEX idx_applicants_bank_account_no
    ON applicants(bank_account_no);

CREATE INDEX idx_applicants_college_id
    ON applicants(college_id);

CREATE INDEX idx_class10_applicant_id
    ON class10_details(applicant_id);

CREATE INDEX idx_class12_applicant_id
    ON class12_details(applicant_id);

CREATE INDEX idx_applied_in_scholarship_id
    ON applied_in(scholarship_id);

CREATE INDEX idx_applied_in_applicant_id
    ON applied_in(applicant_id);

CREATE INDEX idx_applied_in_status
    ON applied_in(status);

CREATE INDEX idx_received_from_applicant_id
    ON received_from(applicant_id);

CREATE INDEX idx_forgot_pass_created_at
    ON forgot_pass(created_at);

-- ============================================================
-- END
-- ============================================================