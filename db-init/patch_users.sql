UPDATE db_users.users SET 
  email='alice@spf.com', 
  password_hash='$2a$10$ry8gq0WM1Hxj29g4ACm57Obfv09Ha61S1CAgeKW177VWlngB7ifRC', 
  role='user' 
WHERE id=1;

UPDATE db_users.users SET 
  email='bob@spf.com', 
  password_hash='$2a$10$ry8gq0WM1Hxj29g4ACm57Obfv09Ha61S1CAgeKW177VWlngB7ifRC', 
  role='user' 
WHERE id=2;

UPDATE db_users.users SET 
  email='admin@spf.com', 
  password_hash='$2a$10$G8A/6r7vVq2dc2INf635M.e9U/EOGnOtQky9YOQFLdhU5TahLHG46', 
  role='admin' 
WHERE id=3;

SELECT id, name, email, role, LEFT(password_hash, 15) as hash_prefix FROM db_users.users;
