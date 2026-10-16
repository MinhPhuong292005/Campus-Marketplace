-- ====================================================================
-- V7__Update_University_Domains_With_ST.sql: Cập nhật cấu trúc email sinh viên có tiền tố st. (Ví dụ: @st.phenikaa-uni.edu.vn)
-- ====================================================================

-- 1. Cập nhật các trường đại học với email domain sinh viên chứa 'st.'
UPDATE universities SET email_domains = 'st.hust.edu.vn,sis.hust.edu.vn,hust.edu.vn' WHERE id = 1;
UPDATE universities SET email_domains = 'st.vnuhcm.edu.vn,st.hcmut.edu.vn,st.uit.edu.vn,st.ussh.edu.vn,vnuhcm.edu.vn' WHERE id = 2;
UPDATE universities SET email_domains = 'st.neu.edu.vn,neu.edu.vn' WHERE id = 3;
UPDATE universities SET email_domains = 'st.fpt.edu.vn,fpt.edu.vn,fe.edu.vn' WHERE id = 4;
UPDATE universities SET email_domains = 'st.phenikaa-uni.edu.vn,st.phenikaa.edu.vn,phenikaa-uni.edu.vn' WHERE id = 5;
UPDATE universities SET email_domains = 'st.vnu.edu.vn,st.uet.vnu.edu.vn,st.ulis.vnu.edu.vn,st.ussh.vnu.edu.vn,vnu.edu.vn' WHERE id = 6;
UPDATE universities SET email_domains = 'st.ftu.edu.vn,ftu.edu.vn' WHERE id = 7;
UPDATE universities SET email_domains = 'st.ptit.edu.vn,stu.ptit.edu.vn,ptit.edu.vn' WHERE id = 8;
UPDATE universities SET email_domains = 'st.haui.edu.vn,sv.haui.edu.vn,haui.edu.vn' WHERE id = 9;
UPDATE universities SET email_domains = 'st.utc.edu.vn,utc.edu.vn' WHERE id = 10;
UPDATE universities SET email_domains = 'st.hcmute.edu.vn,student.hcmute.edu.vn,hcmute.edu.vn' WHERE id = 11;
UPDATE universities SET email_domains = 'st.ueh.edu.vn,ueh.edu.vn' WHERE id = 12;
UPDATE universities SET email_domains = 'st.tdtu.edu.vn,student.tdtu.edu.vn,tdtu.edu.vn' WHERE id = 13;
UPDATE universities SET email_domains = 'st.huce.edu.vn,huce.edu.vn' WHERE id = 14;
UPDATE universities SET email_domains = 'st.tmu.edu.vn,tmu.edu.vn' WHERE id = 15;
UPDATE universities SET email_domains = 'st.tlu.edu.vn,tlu.edu.vn' WHERE id = 16;
UPDATE universities SET email_domains = 'st.hanu.edu.vn,hanu.edu.vn' WHERE id = 17;
UPDATE universities SET email_domains = 'st.hvtc.edu.vn,st.aof.edu.vn,aof.edu.vn' WHERE id = 18;
UPDATE universities SET email_domains = 'st.hvnh.edu.vn,st.ba.edu.vn,ba.edu.vn' WHERE id = 19;
UPDATE universities SET email_domains = 'st.hmu.edu.vn,hmu.edu.vn' WHERE id = 20;
UPDATE universities SET email_domains = 'st.hnue.edu.vn,hnue.edu.vn' WHERE id = 21;
UPDATE universities SET email_domains = 'st.hlu.edu.vn,hlu.edu.vn' WHERE id = 22;
UPDATE universities SET email_domains = 'st.hou.edu.vn,hou.edu.vn' WHERE id = 23;
UPDATE universities SET email_domains = 'st.hcmus.edu.vn,hcmus.edu.vn' WHERE id = 24;
UPDATE universities SET email_domains = 'st.ctu.edu.vn,ctu.edu.vn' WHERE id = 25;
UPDATE universities SET email_domains = 'st.udn.vn,dut.udn.vn,due.udn.vn,udn.vn' WHERE id = 26;
UPDATE universities SET email_domains = 'st.edu.vn,edu.vn' WHERE id = 99;

-- 2. Thêm hoặc cập nhật tài khoản sinh viên Phenikaa mẫu với email @st.phenikaa-uni.edu.vn
INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id,
    student_code, student_card_verified, karma_score, role, status, created_at, updated_at
) VALUES (
    '23010190@st.phenikaa-uni.edu.vn',
    '$2a$12$59g62Q11PLrcv4oDaMkWfO0t39dUHIK4tYI0cyalumzihEQ/TKbuq', -- Hash of 'Aa123'
    'Sinh Viên Phenikaa',
    '0988776655',
    5,
    8,
    '23010190',
    true,
    50,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;
