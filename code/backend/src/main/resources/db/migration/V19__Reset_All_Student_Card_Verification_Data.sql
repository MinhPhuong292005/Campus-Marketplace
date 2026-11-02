-- V19: Reset all student card verification data since no real student has submitted a card yet
UPDATE users 
SET 
    student_card_verified = false, 
    student_card_image_url = NULL;
