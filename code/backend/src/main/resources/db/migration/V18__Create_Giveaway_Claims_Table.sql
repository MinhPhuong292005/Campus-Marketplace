-- V18: Create Giveaway Claims Table for Phenikaa Campus Marketplace
CREATE TABLE IF NOT EXISTS giveaway_claims (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    meeting_time VARCHAR(100),
    meeting_point VARCHAR(255),
    giver_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    receiver_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_giveaway_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_giveaway_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_giveaway_listing ON giveaway_claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_requester ON giveaway_claims(requester_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_status ON giveaway_claims(status);

