-- Create separate databases for each service domain
CREATE DATABASE IF NOT EXISTS db_users;
CREATE DATABASE IF NOT EXISTS db_cafes;
CREATE DATABASE IF NOT EXISTS db_reviews;
CREATE DATABASE IF NOT EXISTS db_folders;
CREATE DATABASE IF NOT EXISTS db_notes;

-- Grant privileges to the admin user (configured in docker-compose.yml)
GRANT ALL PRIVILEGES ON db_users.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON db_cafes.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON db_reviews.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON db_folders.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON db_notes.* TO 'admin'@'%';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- ==========================================
-- 1. Database db_users
-- ==========================================
USE db_users;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  bio TEXT,
  profile_pic VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed users
-- password_hash below are bcrypt hashes:
--   users (Alice, Bob) => 'password123'
--   admin              => 'admin123'
INSERT INTO users (id, name, email, password_hash, role, bio, profile_pic) VALUES
(1, 'Alice Johnson',  'alice@spf.com',  '$2a$10$ry8gq0WM1Hxj29g4ACm57Obfv09Ha61S1CAgeKW177VWlngB7ifRC', 'user',  'Coffee enthusiast & UI Designer',       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(2, 'Bob Smith',     'bob@spf.com',    '$2a$10$ry8gq0WM1Hxj29g4ACm57Obfv09Ha61S1CAgeKW177VWlngB7ifRC', 'user',  'Lead Developer @ Smart Place Finder',   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
(3, 'Admin SPF',     'admin@spf.com',  '$2a$10$G8A/6r7vVq2dc2INf635M.e9U/EOGnOtQky9YOQFLdhU5TahLHG46', 'admin', 'Smart Place Finder Administrator',       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150')
ON DUPLICATE KEY UPDATE id=VALUES(id);

-- ==========================================
-- 2. Database db_cafes
-- ==========================================
USE db_cafes;

CREATE TABLE IF NOT EXISTS cafes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  photo VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  publish_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed cafes
INSERT INTO cafes (id, name, description, address, photo, rating, publish_status) VALUES
(1, 'Kopi Kenangan Mantan', 'Cafe nyaman dengan kopi susu manis andalan.', 'Jl. Sudirman No. 12, Jakarta', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500', 4.50, 'APPROVED'),
(2, 'Brew & Bite', 'Tempat ideal untuk WFH dengan koneksi internet cepat.', 'Jl. Dago No. 45, Bandung', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500', 4.20, 'APPROVED'),
(3, 'Senja Coffee Rooftop', 'Cafe instagramable dengan pemandangan sunset yang indah.', 'Jl. Gejayan No. 88, Yogyakarta', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500', 3.80, 'PENDING')
ON DUPLICATE KEY UPDATE id=VALUES(id);

-- ==========================================
-- 3. Database db_reviews
-- ==========================================
USE db_reviews;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cafe_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed reviews
INSERT INTO reviews (id, cafe_id, user_id, rating, review_text) VALUES
(1, 1, 1, 5, 'Kopinya sangat enak, suasananya cocok untuk mengobrol santai.'),
(2, 1, 2, 4, 'Tempat bersih dan pelayanan sangat ramah.'),
(3, 2, 1, 4, 'Internetnya kencang, kopinya pas di kantong.')
ON DUPLICATE KEY UPDATE id=VALUES(id);

-- ==========================================
-- 4. Database db_folders
-- ==========================================
USE db_folders;

CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS folder_cafes (
  folder_id INT NOT NULL,
  cafe_id INT NOT NULL,
  PRIMARY KEY (folder_id, cafe_id)
);

-- Seed folders & folder mappings
INSERT INTO folders (id, user_id, name) VALUES
(1, 1, 'Favorit Jakarta'),
(2, 1, 'Tempat WFH')
ON DUPLICATE KEY UPDATE id=VALUES(id);

INSERT INTO folder_cafes (folder_id, cafe_id) VALUES
(1, 1),
(2, 2)
ON DUPLICATE KEY UPDATE folder_id=VALUES(folder_id), cafe_id=VALUES(cafe_id);

-- ==========================================
-- 5. Database db_notes
-- ==========================================
USE db_notes;

CREATE TABLE IF NOT EXISTS personal_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cafe_id INT NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed personal notes
INSERT INTO personal_notes (id, user_id, cafe_id, note_text) VALUES
(1, 1, 1, 'Catatan pribadi: Colokan listrik ada di pojok dekat jendela, pas untuk charge laptop.'),
(2, 2, 2, 'Catatan pribadi: Paling enak ke sini pagi-pagi jam 8 sebelum ramai.')
ON DUPLICATE KEY UPDATE id=VALUES(id);
