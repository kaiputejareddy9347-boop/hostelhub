USE hostelhub_db;

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('PENDING', 'PAID') DEFAULT 'PENDING',
    billing_month VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 2. Alter Payments Table to reference Invoice
-- Check if invoice_id column already exists to prevent errors
SET @dbname = DATABASE();
SET @tablename = "payments";
SET @columnname = "invoice_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE payments ADD COLUMN invoice_id BIGINT, ADD FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
