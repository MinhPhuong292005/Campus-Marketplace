-- ====================================================================
-- V3__Sprint3_Indexes_And_Rental_Enhancements.sql
-- Thêm trường và chỉ mục tối ưu hiệu năng cho Sprint 3 (Rentals, OCR, Dispute Moderation)
-- ====================================================================

-- 1. Enhance rental_contracts table
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS dispute_reason VARCHAR(500);

-- 2. Enhance reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rental_contract_id BIGINT REFERENCES rental_contracts(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS action_taken VARCHAR(50);

-- 3. High Performance Indexes (Tối ưu hóa thời gian phản hồi API & Query load)
CREATE INDEX IF NOT EXISTS idx_rental_renter_owner ON rental_contracts(renter_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_status ON rental_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rental_listing_id ON rental_contracts(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_severity ON reports(status, severity);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
